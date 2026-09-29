import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Hyprland
import qs.Commons

Item {
  id: root
  property string omarchyPath: ""
  property var shell: null
  property var manifest: null
  signal designerRequested()
  property bool opened: false
  property var doc: null
  property var drafts: []
  property int draftOffset: 0
  property int draftTotal: 0
  property bool dirty: false
  property string status: ""
  property string outputPath: ""
  property string outputUrl: ""
  property string totalLabel: ""
  property string pendingAction: ""
  property string confirmAction: ""
  property string pendingDraftId: ""
  property string queuedAction: ""
  property bool inFlight: false
  property bool helperStarted: false
  property bool receivedOutput: false
  property bool receivedExit: false
  property string responseText: ""
  property int responseCode: -1
  property int responseExitStatus: -1
  property bool busy: inFlight || worker.running || followup.running
  property string basePath: decodeURIComponent(Qt.resolvedUrl(".").toString().replace(/^file:\/\//, ""))
  property var targetScreen: null

  function open(payloadJson) {
    var payload = ({})
    try { payload = JSON.parse(String(payloadJson || "{}").slice(0, 16384)) || ({}) } catch(e) {}
    if (!opened) {
      var name = Hyprland.focusedMonitor ? Hyprland.focusedMonitor.name : ""
      targetScreen = Quickshell.screens.find(function(s) { return s.name === name }) || Quickshell.screens[0]
    }
    opened = true
    if (!doc && !busy) request("new")
  }
  // Host hide releases focus immediately. The in-memory draft survives reopen.
  // Saving is explicit; the close button offers Save / Discard / Cancel.
  function close() {
    opened=false;confirmAction="";pendingAction="";queuedAction="";followup.stop()
  }
  function snapshot() {
    var d = JSON.parse(JSON.stringify(doc))
    d.items = []
    for (var i=0; i<lines.count; i++) {
      var row=lines.get(i)
      d.items.push({description:row.description,quantity:row.quantity,price:row.price})
    }
    return d
  }
  function setDoc(d) {
    doc=JSON.parse(JSON.stringify(d)); lines.clear()
    d.items.forEach(function(x) { lines.append(x) })
    dirty=false; outputPath="";outputUrl="";totalLabel=""
  }
  function edit(key,value) { doc[key]=value; dirty=true; outputPath="";totalLabel="" }
  function request(action, offset) {
    if (busy) return
    inFlight=true;helperStarted=false;receivedOutput=false;receivedExit=false
    responseText="";responseCode=-1;responseExitStatus=-1
    worker.action=action
    worker.payload=JSON.stringify({action:action,
      draft:(action==="save" || action==="total" || action==="preview" || action==="export") && doc ? snapshot() : null,
      id:action==="load" ? pendingDraftId : null,
      offset:offset === undefined ? draftOffset : offset})
    status=action === "export" || action === "preview" ? "Rendering PDF…" : "Working…"
    worker.running=true
  }
  function transition(action,index) {
    if(busy || confirmAction!=="") return
    pendingDraftId = index === undefined || !drafts[index] ? "" : drafts[index].id
    if(dirty) {confirmAction=action; return}
    perform(action)
  }
  function perform(action) {
    if(action==="designer") {close();designerRequested()}
    else if(action==="close") close()
    else if(action==="new") request("new")
    else if(action==="load" && pendingDraftId!=="") request("load")
  }
  function savedAction(action) {
    if(dirty || !doc.number) {pendingAction=action;request("save")}
    else request(action)
  }
  function discardChanges() {
    var action=confirmAction;confirmAction=""
    // Keep the edited document and dirty flag until its replacement succeeds.
    if(action==="close" || action==="designer") {doc=null;lines.clear();dirty=false;outputPath="";outputUrl=""}
    perform(action)
  }
  function failRequest(message) {
    pendingAction="";queuedAction="";followup.stop();inFlight=false
    responseText="";worker.payload=""
    status=String(message || "Operation failed.").slice(0,1024)
  }
  function receiveOutput(text) {
    if(!inFlight) return
    responseText=String(text);receivedOutput=true;finishRequest()
  }
  function receiveExit(code, exitStatus) {
    if(!inFlight) return
    responseCode=code;responseExitStatus=exitStatus;receivedExit=true;finishRequest()
  }
  function validResponse(response) {
    var action=worker.action
    if(action==="new" || action==="save" || action==="load") {
      var d=response.draft
      if(!d || typeof d.id!=="string" || typeof d.revision!=="number" || !Array.isArray(d.items) || d.items.length<1 || d.items.length>100) return false
      var fields=["number","date","due","company","companyAddress","customer","customerAddress","currency","taxRate","payment","notes"]
      for(var i=0;i<fields.length;i++) if(typeof d[fields[i]]!=="string" || d[fields[i]].length>500) return false
      for(var j=0;j<d.items.length;j++) {
        var line=d.items[j]
        if(!line || typeof line.description!=="string" || typeof line.quantity!=="string" || typeof line.price!=="string") return false
      }
      return true
    }
    if(action==="list") {
      if(!Array.isArray(response.drafts) || response.drafts.length>50 || !Number.isInteger(response.offset) || !Number.isInteger(response.total) || response.offset<0 || response.total<0 || response.total>1000) return false
      return response.drafts.every(function(d) {return d && typeof d.id==="string" && typeof d.number==="string"})
    }
    if(action==="total") return typeof response.total==="string" && typeof response.subtotal==="string" && typeof response.tax==="string"
    if(action==="preview" || action==="export") return typeof response.path==="string" && typeof response.url==="string" && response.url.indexOf("file:///")===0
    return false
  }
  function finishRequest() {
    if(!inFlight || !receivedOutput || !receivedExit) return
    var response
    try {
      if(responseText.length>262144) throw Error("Oversized response")
      response=JSON.parse(responseText)
      if(!response || typeof response.ok!=="boolean") throw Error("Invalid response")
    } catch(e) {
      failRequest("Renderer unavailable or returned invalid output. Check Node.js 22+ and update the plugin if bundled files are missing.");return
    }
    if(!response.ok) {failRequest(response.error);return}
    if(responseCode!==0 || responseExitStatus!==0) {
      failRequest("Helper stopped unexpectedly. Reopen the saved draft to check whether the save completed.");return
    }
    if(!validResponse(response)) {failRequest("Renderer returned an incomplete response. Your edits have been kept.");return}
    if(worker.action === "total" && response.total) totalLabel="Subtotal: "+response.subtotal+" · Tax: "+response.tax+" · Total: "+response.total
    if(response.draft) setDoc(response.draft)
    if(response.drafts) {drafts=response.drafts;draftOffset=response.offset;draftTotal=response.total}
    if(response.path) {
      outputPath=response.path;outputUrl=response.url
      status=worker.action === "preview" ? "Preview ready — open it below." : "PDF exported — open it below."
    } else status=worker.action === "save" ? "Draft saved" : "Ready"
    responseText="";inFlight=false
    if(opened && (worker.action === "new" || worker.action === "save")) {
      queuedAction=pendingAction || "list";pendingAction="";followup.start()
    } else pendingAction=""
  }
  function runFollowup() {
    followup.stop()
    if(worker.running || inFlight) {followup.restart();return}
    var next=queuedAction;queuedAction=""
    if(!opened || !next) return
    if(next==="list") request("list",0)
    else if(next==="preview" || next==="export") request(next)
    else perform(next)
  }
  function abortRequest(message) {
    failRequest(message)
    if(worker.running) worker.signal(9)
  }
  ListModel { id: lines }
  Process {
    id: worker
    property string action: ""
    property string payload: ""
    command: ["node", root.basePath + "dist/renderer.mjs"]
    // Avoid inherited Node preload hooks changing the helper protocol.
    environment: ({NODE_OPTIONS:null,NODE_PATH:null})
    stdinEnabled: true
    onStarted: {root.helperStarted=true;write(payload + "\n");payload=""}
    stdout: StdioCollector {waitForEnd:true;onStreamFinished:root.receiveOutput(text)}
    onExited: function(code, exitStatus) {root.receiveExit(code,exitStatus)}
  }
  Timer {id:followup;interval:1;onTriggered:root.runFollowup()}
  Timer {
    interval:5000;running:root.inFlight && !root.helperStarted
    onTriggered:root.abortRequest("Could not start the renderer. Check Node.js 22+ is available to the shell.")
  }
  Timer {
    interval:50000;running:root.inFlight
    onTriggered:root.abortRequest("Operation timed out. Reopen the saved draft to check whether the save completed.")
  }
  component Field: ColumnLayout {
    property string caption: ""
    property alias text: input.text
    property int maximumLength: 100
    signal edited(string value)
    Layout.fillWidth: true
    spacing: 4
    Label {text:parent.caption;color:Color.popups.text;opacity:0.7;font.pixelSize:12}
    TextField {id:input;Layout.fillWidth:true;selectByMouse:true;maximumLength:parent.maximumLength;onTextEdited:parent.edited(text)}
  }
  PanelWindow {
    id: window
    screen: root.targetScreen
    visible: root.opened
    implicitWidth: Math.min(1040, screen ? screen.width - 40 : 1040)
    implicitHeight: Math.min(850, screen ? screen.height - 50 : 850)
    color: "transparent"
    WlrLayershell.namespace: "io-github-tcballard-pdf-studio"
    WlrLayershell.layer: WlrLayer.Top
    WlrLayershell.keyboardFocus: root.opened ? WlrKeyboardFocus.OnDemand : WlrKeyboardFocus.None
    exclusionMode: ExclusionMode.Ignore
    Pane {
      anchors.fill:parent;padding:0
  Shortcut {sequence: "Escape";enabled:root.opened && !root.busy && root.confirmAction==="";onActivated:root.transition("close")}
  Shortcut {sequence:"Ctrl+S";enabled:root.opened && !root.busy && root.doc!==null && root.confirmAction==="";onActivated:root.request("save")}

      background: Rectangle {radius:Style.cornerRadius;color:Color.popups.background;border.color:Color.popups.border;border.width:1}
      palette.window: Color.popups.background
      palette.base: Color.popups.background
      palette.text: Color.popups.text
      palette.windowText: Color.popups.text
      palette.buttonText: Color.popups.text
      palette.button: Color.popups.background
      ColumnLayout {
        anchors.fill:parent;anchors.margins:24;spacing:14;enabled:root.confirmAction===""
        RowLayout {
          Label {text:"PDF Studio";font.pixelSize:24;font.bold:true;color:Color.popups.text}
          Label {text:"/  INVOICES";font.pixelSize:12;color:Color.popups.text;opacity:0.6;Layout.fillWidth:true}
          Button {text:"Document designer";enabled:!root.busy;onClicked:root.transition("designer")}
          Button {text:"Close";enabled:!root.busy;onClicked:root.transition("close")}
        }
        RowLayout {
          enabled:!root.busy
          Button {text:"New invoice";onClicked:root.transition("new")}
          ComboBox {
            id: draftPicker; Layout.fillWidth:true;model:root.drafts;textRole:"number"
            displayText:root.draftTotal ? "Saved drafts ("+(root.draftOffset+1)+"–"+(root.draftOffset+root.drafts.length)+" of "+root.draftTotal+")" : "No saved drafts yet"
            delegate:ItemDelegate {
              required property var modelData
              width:draftPicker.width
              contentItem:Label {text:modelData.number;textFormat:Text.PlainText;color:Color.popups.text;elide:Text.ElideRight}
            }
            onActivated:function(index) {root.transition("load",index)}
          }
          Button {text:"Previous";enabled:root.draftOffset>0;onClicked:root.request("list",root.draftOffset-50)}
          Button {text:"Next";enabled:root.draftOffset+50<root.draftTotal;onClicked:root.request("list",root.draftOffset+50)}
          Label {text:root.dirty?"Unsaved changes":"";color:Color.popups.text}
          Button {text:"Save draft";enabled:root.doc!==null;onClicked:root.request("save")}
        }
        ScrollView {
          Layout.fillWidth:true;Layout.fillHeight:true;clip:true
          contentWidth:availableWidth
          ColumnLayout {
            width:parent.width;spacing:16;enabled:!root.busy && root.doc!==null
            RowLayout {
              Field {caption:"Your business";text:root.doc?root.doc.company:"";onEdited:function(value){root.edit("company",value)}}
              Field {caption:"Customer";text:root.doc?root.doc.customer:"";onEdited:function(value){root.edit("customer",value)}}
            }
            RowLayout {
              Field {caption:"Business address / contact";maximumLength:500;text:root.doc?root.doc.companyAddress:"";onEdited:function(value){root.edit("companyAddress",value)}}
              Field {caption:"Customer address / contact";maximumLength:500;text:root.doc?root.doc.customerAddress:"";onEdited:function(value){root.edit("customerAddress",value)}}
            }
            RowLayout {
              Field {caption:"Invoice number (blank = automatic)";text:root.doc?root.doc.number:"";onEdited:function(value){root.edit("number",value)}}
              Field {caption:"Issued · YYYY-MM-DD";maximumLength:10;text:root.doc?root.doc.date:"";onEdited:function(value){root.edit("date",value)}}
              Field {caption:"Due · YYYY-MM-DD";maximumLength:10;text:root.doc?root.doc.due:"";onEdited:function(value){root.edit("due",value)}}
            }
            RowLayout {
              Label {text:"Currency";color:Color.popups.text}
              ComboBox {model:["GBP","EUR","USD"];currentIndex:root.doc?model.indexOf(root.doc.currency):0;onActivated:root.edit("currency",currentText)}
              Field {caption:"Tax % (applied to subtotal)";maximumLength:6;text:root.doc?root.doc.taxRate:"0";onEdited:function(value){root.edit("taxRate",value)}}
            }
            Label {text:"LINE ITEMS";font.bold:true;color:Color.popups.text}
            Repeater {
              model:lines
              delegate:RowLayout {
                required property int index
                required property string description
                required property string quantity
                required property string price
                Layout.fillWidth:true
                Field {caption:"Description";maximumLength:200;text:description;onEdited:function(value){lines.setProperty(index,"description",value);root.dirty=true;root.outputPath="";root.totalLabel=""}}
                Field {caption:"Quantity";maximumLength:13;Layout.maximumWidth:90;text:quantity;onEdited:function(value){lines.setProperty(index,"quantity",value);root.dirty=true;root.outputPath="";root.totalLabel=""}}
                Field {caption:"Unit price";maximumLength:12;Layout.maximumWidth:120;text:price;onEdited:function(value){lines.setProperty(index,"price",value);root.dirty=true;root.outputPath="";root.totalLabel=""}}
                Button {text:"Remove";enabled:lines.count>1;onClicked:{lines.remove(index);root.dirty=true;root.outputPath="";root.totalLabel=""}}
              }
            }
            Button {text:"+ Add line";enabled:lines.count<100;onClicked:{lines.append({description:"",quantity:"1",price:"0.00"});root.dirty=true;root.outputPath="";root.totalLabel=""}}
            Field {caption:"Payment details";maximumLength:500;text:root.doc?root.doc.payment:"";onEdited:function(value){root.edit("payment",value)}}
            Field {caption:"Notes";maximumLength:500;text:root.doc?root.doc.notes:"";onEdited:function(value){root.edit("notes",value)}}
          }
        }
        RowLayout {
          Button {text:"Calculate total";enabled:!root.busy && root.doc!==null;onClicked:root.request("total")}
          Label {text:root.totalLabel;textFormat:Text.PlainText;color:Color.popups.text;Layout.fillWidth:true}
        }
        Label {text:root.status;textFormat:Text.PlainText;color:Color.popups.text;wrapMode:Text.Wrap;Layout.fillWidth:true}
        RowLayout {
          Label {text:"Stored locally · No account required";color:Color.popups.text;opacity:0.6;Layout.fillWidth:true}
          Button {text:"Open PDF";visible:root.outputPath!=="";onClicked:{if(!Qt.openUrlExternally(root.outputUrl))root.status="Could not open the PDF. Check your default PDF viewer."}}
          Button {text:"Preview";enabled:!root.busy && root.doc!==null;onClicked:root.savedAction("preview")}
          Button {text:"Export PDF";enabled:!root.busy && root.doc!==null;onClicked:root.savedAction("export")}
        }
      }
      Popup {
        id:confirmDialog
        anchors.centerIn:parent
        visible:root.opened && root.confirmAction!==""
        modal:true;focus:true;closePolicy:Popup.NoAutoClose
        padding:24
        background:Rectangle {color:Color.popups.background;radius:Style.cornerRadius;border.color:Color.popups.border;border.width:1}
        contentItem:ColumnLayout {
          spacing:16
          Shortcut {sequence:"Escape";enabled:confirmDialog.visible;onActivated:root.confirmAction=""}
          Label {text:"Save your changes?";font.pixelSize:22;color:Color.popups.text}
          Label {text:"This invoice has unsaved edits.";color:Color.popups.text}
          RowLayout {
            Button {text:"Cancel";onClicked:root.confirmAction=""}
            Button {text:"Discard";onClicked:root.discardChanges()}
            Button {text:"Save";onClicked:{root.pendingAction=root.confirmAction;root.confirmAction="";root.request("save")}}
          }
        }
      }
    }
  }
}
