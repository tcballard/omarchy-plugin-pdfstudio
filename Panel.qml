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
  property bool opened: false
  property var doc: null
  property var drafts: []
  property bool dirty: false
  property string status: ""
  property string outputPath: ""
  property string totalLabel: ""
  property string pendingAction: ""
  property string confirmAction: ""
  property int pendingIndex: -1
  property bool busy: worker.running
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
  function close() { opened = false; confirmAction = "" }
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
    dirty=false; outputPath="";totalLabel=""
  }
  function edit(key,value) { doc[key]=value; dirty=true; outputPath="";totalLabel="" }
  function request(action) {
    if (busy) return
    worker.action=action
    worker.payload=JSON.stringify({action:action,draft:doc ? snapshot() : null})
    status=action === "export" || action === "preview" ? "Rendering PDF…" : "Working…"
    worker.running=true
  }
  function transition(action,index) {
    if(busy) return
    pendingIndex = index === undefined ? -1 : index
    if(dirty) {confirmAction=action; return}
    perform(action)
  }
  function perform(action) {
    if(action==="close") close()
    else if(action==="new") request("new")
    else if(action==="load" && pendingIndex>=0) {setDoc(drafts[pendingIndex]);status="Draft opened"}
  }
  function savedAction(action) {
    if(dirty || !doc.number) {pendingAction=action;request("save")}
    else request(action)
  }
  ListModel { id: lines }
  Process {
    id: worker
    property string action: ""
    property string payload: ""
    command: ["node", root.basePath + "dist/renderer.mjs"]
    stdinEnabled: true
    onStarted: { write(payload + "\n"); payload="" }
    stdout: StdioCollector {
      onStreamFinished: {
        var response
        try {response=JSON.parse(text)} catch(e) {root.status="Renderer unavailable. Check Node.js 22+ is available and update the plugin if bundled files are missing.";root.pendingAction="";return}
        if(!response.ok) {root.status=response.error;root.pendingAction="";return}
        if(response.total) root.totalLabel="Subtotal: "+response.subtotal+" · Tax: "+response.tax+" · Total: "+response.total
        if(response.draft) root.setDoc(response.draft)
        if(response.drafts) root.drafts=response.drafts
        if(response.path) {
          root.outputPath=response.path
          root.status=worker.action === "preview" ? "Preview ready — open it below." : "PDF exported — open it below."
        } else root.status=worker.action === "save" ? "Draft saved" : "Ready"
        if(worker.action === "new" || worker.action === "save") followup.start()
      }
    }
    onExited: function(code, exitStatus) {
      if(code!==0 && root.status==="Working…") root.status="Helper failed. Check that Node.js 22+ is available to the shell."
    }
  }
  Timer {
    id: followup; interval: 30
    onTriggered: {
      if(root.busy) {restart();return}
      if(root.pendingAction) {
        var next=root.pendingAction;root.pendingAction=""
        if(next==="preview" || next==="export") root.request(next)
        else root.perform(next)
      } else root.request("list")
    }
  }
  Timer {interval:50000;running:worker.running;onTriggered:{worker.running=false;root.pendingAction="";root.status="Operation timed out. Reopen the saved draft to check whether the save completed."}}
  component Field: ColumnLayout {
    property string caption: ""
    property alias text: input.text
    signal edited(string value)
    Layout.fillWidth: true
    spacing: 4
    Label {text:parent.caption;color:Color.popups.text;opacity:0.7;font.pixelSize:12}
    TextField {id:input;Layout.fillWidth:true;selectByMouse:true;onTextEdited:parent.edited(text)}
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
  Shortcut {sequence: "Escape";enabled:root.opened && !root.busy;onActivated:root.confirmAction!=="" ? root.confirmAction="" : root.transition("close")}
  Shortcut {sequence:"Ctrl+S";enabled:root.opened && !root.busy && root.doc!==null;onActivated:root.request("save")}

      background: Rectangle {radius:Style.cornerRadius;color:Color.popups.background;border.color:Color.popups.border;border.width:1}
      palette.window: Color.popups.background
      palette.base: Color.popups.background
      palette.text: Color.popups.text
      palette.windowText: Color.popups.text
      palette.buttonText: Color.popups.text
      palette.button: Color.popups.background
      ColumnLayout {
        anchors.fill:parent;anchors.margins:24;spacing:14
        RowLayout {
          Label {text:"PDF Studio";font.pixelSize:24;font.bold:true;color:Color.popups.text}
          Label {text:"/  INVOICES";font.pixelSize:12;color:Color.popups.text;opacity:0.6;Layout.fillWidth:true}
          Button {text:"Close";enabled:!root.busy;onClicked:root.transition("close")}
        }
        RowLayout {
          enabled:!root.busy
          Button {text:"New invoice";onClicked:root.transition("new")}
          ComboBox {
            id: draftPicker; Layout.fillWidth:true;model:root.drafts;textRole:"number"
            displayText:root.drafts.length ? "Saved drafts ("+root.drafts.length+")" : "No saved drafts yet"
            onActivated:function(index) {root.transition("load",index)}
          }
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
              Field {caption:"Business address / contact";text:root.doc?root.doc.companyAddress:"";onEdited:function(value){root.edit("companyAddress",value)}}
              Field {caption:"Customer address / contact";text:root.doc?root.doc.customerAddress:"";onEdited:function(value){root.edit("customerAddress",value)}}
            }
            RowLayout {
              Field {caption:"Invoice number (blank = automatic)";text:root.doc?root.doc.number:"";onEdited:function(value){root.edit("number",value)}}
              Field {caption:"Issued · YYYY-MM-DD";text:root.doc?root.doc.date:"";onEdited:function(value){root.edit("date",value)}}
              Field {caption:"Due · YYYY-MM-DD";text:root.doc?root.doc.due:"";onEdited:function(value){root.edit("due",value)}}
            }
            RowLayout {
              Label {text:"Currency";color:Color.popups.text}
              ComboBox {model:["GBP","EUR","USD"];currentIndex:root.doc?model.indexOf(root.doc.currency):0;onActivated:root.edit("currency",currentText)}
              Field {caption:"Tax % (applied to subtotal)";text:root.doc?root.doc.taxRate:"0";onEdited:function(value){root.edit("taxRate",value)}}
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
                Field {caption:"Description";text:description;onEdited:function(value){lines.setProperty(index,"description",value);root.dirty=true;root.outputPath="";root.totalLabel=""}}
                Field {caption:"Quantity";Layout.maximumWidth:90;text:quantity;onEdited:function(value){lines.setProperty(index,"quantity",value);root.dirty=true;root.outputPath="";root.totalLabel=""}}
                Field {caption:"Unit price";Layout.maximumWidth:120;text:price;onEdited:function(value){lines.setProperty(index,"price",value);root.dirty=true;root.outputPath="";root.totalLabel=""}}
                Button {text:"Remove";enabled:lines.count>1;onClicked:{lines.remove(index);root.dirty=true;root.outputPath="";root.totalLabel=""}}
              }
            }
            Button {text:"+ Add line";enabled:lines.count<100;onClicked:{lines.append({description:"",quantity:"1",price:"0.00"});root.dirty=true;root.outputPath="";root.totalLabel=""}}
            Field {caption:"Payment details";text:root.doc?root.doc.payment:"";onEdited:function(value){root.edit("payment",value)}}
            Field {caption:"Notes";text:root.doc?root.doc.notes:"";onEdited:function(value){root.edit("notes",value)}}
          }
        }
        RowLayout {
          Button {text:"Calculate total";enabled:!root.busy && root.doc!==null;onClicked:root.request("total")}
          Label {text:root.totalLabel;color:Color.popups.text;Layout.fillWidth:true}
        }
        Label {text:root.status;color:Color.popups.text;wrapMode:Text.Wrap;Layout.fillWidth:true}
        RowLayout {
          Label {text:"Stored locally · No account required";color:Color.popups.text;opacity:0.6;Layout.fillWidth:true}
          Button {text:"Open PDF";visible:root.outputPath!=="";onClicked:Qt.openUrlExternally("file://"+root.outputPath)}
          Button {text:"Preview";enabled:!root.busy && root.doc!==null;onClicked:root.savedAction("preview")}
          Button {text:"Export PDF";enabled:!root.busy && root.doc!==null;onClicked:root.savedAction("export")}
        }
      }
      Rectangle {
        anchors.fill:parent;visible:root.confirmAction!=="";color:Color.popups.background;radius:Style.cornerRadius
        MouseArea {anchors.fill:parent}
        ColumnLayout {
          anchors.centerIn:parent;spacing:16
          Label {text:"Save your changes?";font.pixelSize:22;color:Color.popups.text}
          Label {text:"This invoice has unsaved edits.";color:Color.popups.text}
          RowLayout {
            Button {text:"Cancel";onClicked:root.confirmAction=""}
            Button {text:"Discard";onClicked:{var a=root.confirmAction;root.confirmAction="";root.dirty=false;if(a==="close")root.doc=null;root.perform(a)}}
            Button {text:"Save";onClicked:{root.pendingAction=root.confirmAction;root.confirmAction="";root.request("save")}}
          }
        }
      }
    }
  }
}
