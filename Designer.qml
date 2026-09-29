import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Hyprland
import qs.Commons

Item {
  id: root
  signal invoicesRequested()
  property bool opened: false
  property var targetScreen: null
  property var doc: null
  property int selectedIndex: -1
  readonly property var selected: doc && selectedIndex>=0 && selectedIndex<doc.blocks.length ? doc.blocks[selectedIndex] : null
  property bool dirty: false
  property var undoStack: []
  property var redoStack: []
  property string editGroup: ""
  property var entries: []
  property int entryOffset: 0
  property int entryTotal: 0
  property bool showTemplates: false
  property string status: "Start with a blank page or a template."
  property string outputUrl: ""
  property string previewUrl: ""
  property bool previewStale: false
  property int previewPage: 1
  property int previewPages: 1
  property string confirmAction: ""
  property var transitionArgs: ({})
  property string queuedAction: ""
  property var queuedArgs: ({})
  property string importTarget: ""
  property bool inFlight: false
  property bool helperStarted: false
  property bool receivedOutput: false
  property bool receivedExit: false
  property string responseText: ""
  property int responseCode: -1
  property int responseExitStatus: -1
  readonly property bool busy: inFlight || worker.running || followup.running
  property string basePath: decodeURIComponent(Qt.resolvedUrl(".").toString().replace(/^file:\/\//,""))
  readonly property var types: ["heading","text","image","table","divider","spacer","columns","pageBreak"]
  readonly property var typeNames: ["Heading","Text","Image","Table","Divider","Spacer","Two columns","Page break"]
  function clone(x) {return JSON.parse(JSON.stringify(x))}
  function open(payloadJson) {
    if(!opened) {
      var name=Hyprland.focusedMonitor ? Hyprland.focusedMonitor.name : ""
      targetScreen=Quickshell.screens.find(function(s){return s.name===name}) || Quickshell.screens[0]
    }
    opened=true
    if(!doc && !busy) request("designNew",{preset:"blank"})
  }
  function close() {imagePicker.close();opened=false;confirmAction="";queuedAction="";followup.stop()}
  function setDoc(d) {
    doc=clone(d);selectedIndex=d.blocks.length ? 0 : -1;dirty=false
    undoStack=[];redoStack=[];editGroup="";outputUrl="";previewUrl="";previewPage=1;previewPages=1;previewStale=false
  }
  function uuid() {return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){var r=Math.floor(Math.random()*16);return (c==="x"?r:(r&3|8)).toString(16)})}
  function change(next,group) {
    if(busy || !doc || confirmAction!=="") return
    if(!group || editGroup!==group) undoStack=undoStack.concat([clone(doc)]).slice(-30)
    editGroup=group || "";coalesce.restart();redoStack=[];doc=next;dirty=true;previewStale=true;outputUrl=""
  }
  function edit(key,value) {var d=clone(doc);d[key]=value;change(d,"document-"+key)}
  function pageEdit(key,value) {var d=clone(doc);d.page[key]=value;change(d,"page-"+key)}
  function blockEdit(key,value) {
    if(!selected) return
    var d=clone(doc);d.blocks[selectedIndex][key]=value;change(d,selected.id+key)
  }
  function addBlock(type) {
    if(!doc || doc.blocks.length>=80 || types.indexOf(type)<0) return
    if(type==="image" && doc.blocks.filter(function(b){return b.type==="image"}).length>=8){status="Use at most eight images.";return}
    var b={id:uuid(),type:type,font:"sans",size:type==="heading"?26:11,bold:type==="heading",color:"#18212b",align:"left",spacing:12}
    if(type==="heading" || type==="text") b.text=type==="heading"?"Your heading":"Write your text here."
    if(type==="columns"){b.left="Left column";b.right="Right column"}
    if(type==="table"){b.rows=[["Item","Details"],["First item","Description"]];b.header=true}
    if(type==="image"){b.asset="";b.width=100;b.height=180;b.text=""}
    if(type==="divider" || type==="spacer")b.height=type==="divider"?1:24
    var d=clone(doc);var index=selectedIndex<0?d.blocks.length:selectedIndex+1;d.blocks.splice(index,0,b);change(d,"");selectedIndex=index
  }
  function moveBlock(delta) {
    var i=selectedIndex,j=i+delta;if(!selected || j<0 || j>=doc.blocks.length)return
    var d=clone(doc),b=d.blocks.splice(i,1)[0];d.blocks.splice(j,0,b);change(d,"");selectedIndex=j
  }
  function removeBlock() {
    if(!selected)return
    var d=clone(doc);d.blocks.splice(selectedIndex,1);change(d,"");selectedIndex=Math.min(selectedIndex,d.blocks.length-1)
  }
  function duplicateBlock() {
    if(!selected || doc.blocks.length>=80)return
    if(selected.type==="image" && doc.blocks.filter(function(b){return b.type==="image"}).length>=8){status="Use at most eight images.";return}
    var d=clone(doc),b=clone(selected);b.id=uuid();d.blocks.splice(selectedIndex+1,0,b);change(d,"");selectedIndex++
  }
  function history(redo) {
    if(busy || !doc || confirmAction!=="")return
    var from=redo?redoStack:undoStack;if(!from.length)return
    var d=clone(from[from.length-1]);d.revision=doc.revision
    if(redo){redoStack=from.slice(0,-1);undoStack=undoStack.concat([clone(doc)]).slice(-30)}
    else {undoStack=from.slice(0,-1);redoStack=redoStack.concat([clone(doc)]).slice(-30)}
    doc=d;selectedIndex=Math.min(selectedIndex,d.blocks.length-1);dirty=true;previewStale=true;outputUrl="";editGroup=""
  }
  function tableCell(row,col,text) {var rows=clone(selected.rows);rows[row][col]=text;blockEdit("rows",rows)}
  function tableSize(axis,delta) {
    var rows=clone(selected.rows)
    if(axis==="row") {if(delta>0 && rows.length<40)rows.push(rows[0].map(function(){return ""}));else if(delta<0 && rows.length>1)rows.pop()}
    else {if(delta>0 && rows[0].length<6)rows.forEach(function(r){r.push("")});else if(delta<0 && rows[0].length>1)rows.forEach(function(r){r.pop()})}
    blockEdit("rows",rows)
  }
  function transition(action,args) {
    if(busy || confirmAction!=="")return
    transitionArgs=args || ({})
    if(dirty){confirmAction=action;return}
    perform(action,transitionArgs)
  }
  function perform(action,args) {
    if(action==="close")close()
    else if(action==="invoices"){close();invoicesRequested()}
    else request(action,args)
  }
  function discardChanges() {
    var action=confirmAction;confirmAction=""
    if(action==="close" || action==="invoices"){doc=null;dirty=false;previewUrl="";outputUrl=""}
    perform(action,transitionArgs)
  }
  function saveThenContinue() {
    queuedAction=confirmAction;queuedArgs=transitionArgs;confirmAction="";request("designSave")
  }
  function list(offset) {request("designList",{template:showTemplates,offset:offset || 0})}
  function request(action,args) {
    if(busy)return
    var payload=args?clone(args):({});payload.action=action
    if(["designSave","designTemplate","designPreview","designExport"].indexOf(action)>=0)payload.document=doc
    var serialized=JSON.stringify(payload)
    // UTF-8 may use four bytes per character; the helper enforces the exact byte limit.
    if(serialized.length>262144){status="Document is too large. Shorten some text or tables.";queuedAction="";return}
    inFlight=true;helperStarted=false;receivedOutput=false;receivedExit=false;responseText="";responseCode=-1;responseExitStatus=-1
    worker.action=action;worker.payload=serialized;status=action==="designPreview" || action==="designExport" ? "Rendering PDF…":"Working…";worker.running=true
  }
  function failRequest(message) {inFlight=false;responseText="";worker.payload="";queuedAction="";followup.stop();status=String(message || "Operation failed. Your edits are still here.").slice(0,1024)}
  function receiveOutput(text) {if(!inFlight)return;responseText=String(text);receivedOutput=true;finishRequest()}
  function receiveExit(code,exitStatus) {if(!inFlight)return;responseCode=code;responseExitStatus=exitStatus;receivedExit=true;finishRequest()}
  function validResponse(r) {
    var a=worker.action
    if(["designNew","designLoad","designSave","designUseTemplate"].indexOf(a)>=0)return r.document && r.document.schema===1 && typeof r.document.id==="string" && Number.isSafeInteger(r.document.revision) && typeof r.document.title==="string" && r.document.page && Array.isArray(r.document.blocks) && r.document.blocks.length<=80
    if(a==="designList")return Array.isArray(r.entries) && r.entries.length<=50 && Number.isInteger(r.offset) && r.offset>=0 && Number.isInteger(r.total) && r.total>=0 && r.total<=128 && r.entries.every(function(e){return e && typeof e.id==="string" && typeof e.title==="string"})
    if(a==="designTemplate")return r.template && typeof r.template.id==="string"
    if(a==="designImport")return typeof r.asset==="string" && /^[0-9a-f]{64}\.(png|jpg)$/.test(r.asset)
    if(a==="designPreview" || a==="designExport")return typeof r.url==="string" && r.url.indexOf("file:///")===0 && (!r.previewUrl || (r.previewUrl.indexOf("file:///")===0 && Number.isInteger(r.page) && Number.isInteger(r.pages) && r.page>0 && r.page<=r.pages && r.pages<=1000))
    return false
  }
  function finishRequest() {
    if(!inFlight || !receivedOutput || !receivedExit)return
    var r
    try {if(responseText.length>262144)throw Error();r=JSON.parse(responseText);if(!r || typeof r.ok!=="boolean")throw Error()}
    catch(e){failRequest("Invalid helper output. Check Node.js 22+ and the bundled renderer.");return}
    if(!r.ok){failRequest(r.error);return}
    if(responseCode!==0 || responseExitStatus!==0){failRequest("Helper stopped unexpectedly. Reload the saved document to check whether the save completed.");return}
    if(!validResponse(r)){failRequest("Incomplete helper response. Your edits have been kept.");return}
    var action=worker.action;inFlight=false;responseText=""
    if(r.document){
      if(action==="designSave"){doc=clone(r.document);dirty=false;editGroup=""}
      else setDoc(r.document)
    }
    if(action==="designList"){entries=r.entries;entryOffset=r.offset;entryTotal=r.total}
    if(action==="designImport"){
      var d=clone(doc),i=d.blocks.findIndex(function(b){return b.id===importTarget && b.type==="image"})
      if(i>=0){undoStack=undoStack.concat([clone(doc)]).slice(-30);redoStack=[];d.blocks[i].asset=r.asset;doc=d;dirty=true;previewStale=true;outputUrl="";editGroup=""}
    }
    if(r.url)outputUrl=r.url
    if(action==="designPreview") {previewUrl=r.previewUrl || "";previewPage=r.page || 1;previewPages=r.pages || 1;previewStale=false}
    status=action==="designSave"?"Document saved":action==="designTemplate"?"Template saved — select Templates to use it":action==="designExport"?"PDF exported to Documents / PDF Studio":action==="designPreview"?(r.previewError || "Preview ready"):"Ready"
    if(opened && queuedAction)followup.start()
    else if(opened && (action==="designNew" || action==="designSave" || action==="designTemplate")){queuedAction="designList";queuedArgs={template:showTemplates,offset:0};followup.start()}
  }
  function runFollowup() {followup.stop();if(worker.running || inFlight){followup.restart();return}var a=queuedAction,args=queuedArgs;queuedAction="";if(opened && a)perform(a,args)}
  function abortRequest(message) {failRequest(message);if(worker.running)worker.signal(9)}
  Timer {id:coalesce;interval:700;onTriggered:root.editGroup=""}
  Timer {id:followup;interval:1;onTriggered:root.runFollowup()}
  Timer {interval:5000;running:root.inFlight && !root.helperStarted;onTriggered:root.abortRequest("Could not start the renderer. Check Node.js 22+.")}
  Timer {interval:50000;running:root.inFlight;onTriggered:root.abortRequest("Operation timed out. Reload the saved document to check whether the save completed.")}
  Process {
    id:worker
    property string action:""
    property string payload:""
    command:["node",root.basePath+"dist/renderer.mjs"]
    environment:({NODE_OPTIONS:null,NODE_PATH:null})
    stdinEnabled:true
    onStarted:{root.helperStarted=true;write(payload+"\n");payload=""}
    stdout:StdioCollector {waitForEnd:true;onStreamFinished:root.receiveOutput(text)}
    onExited:function(code,exitStatus){root.receiveExit(code,exitStatus)}
  }
  component Caption: Label {color:Color.popups.text;opacity:0.65;font.pixelSize:12;Layout.fillWidth:true;wrapMode:Text.Wrap;textFormat:Text.PlainText}
  component Input: TextField {Layout.fillWidth:true;selectByMouse:true;maximumLength:100}
  component CopyArea: ScrollView {
    id:copyRoot
    property string text:""
    signal edited(string value)
    Layout.fillWidth:true;Layout.preferredHeight:150;clip:true
    TextArea {id:area;text:copyRoot.text;wrapMode:TextEdit.Wrap;selectByMouse:true;textFormat:TextEdit.PlainText;onTextChanged:if(activeFocus && text!==copyRoot.text)copyRoot.edited(text)}
  }
  PanelWindow {
    id:window
    screen:root.targetScreen
    visible:root.opened
    implicitWidth:Math.min(1320,screen ? screen.width-40:1320)
    implicitHeight:Math.min(900,screen ? screen.height-50:900)
    color:"transparent"
    WlrLayershell.namespace:"io-github-tcballard-pdf-studio"
    WlrLayershell.layer:WlrLayer.Top
    WlrLayershell.keyboardFocus:root.opened ? WlrKeyboardFocus.OnDemand:WlrKeyboardFocus.None
    exclusionMode:ExclusionMode.Ignore
    Pane {
      anchors.fill:parent;padding:20
      background:Rectangle {radius:Style.cornerRadius;color:Color.popups.background;border.color:Color.popups.border}
      palette.window:Color.popups.background
      palette.base:Color.popups.background
      palette.text:Color.popups.text
      palette.windowText:Color.popups.text
      palette.buttonText:Color.popups.text
      palette.button:Color.popups.background
  FileDialog {
    id:imagePicker
    title:"Import a PNG or JPEG image"
    nameFilters:["Images (*.png *.jpg *.jpeg)"]
    fileMode:FileDialog.OpenFile
    onAccepted:{if(root.opened && !root.busy)root.request("designImport",{path:selectedFile.toString()})}
  }
      Shortcut {sequence:"Escape";enabled:root.opened && !root.busy && root.confirmAction==="";onActivated:root.transition("close")}
      Shortcut {sequence:"Ctrl+S";enabled:root.opened && !root.busy && root.doc!==null && root.confirmAction==="";onActivated:root.request("designSave")}
      ScrollView {
        id:workspaceView
        anchors.fill:parent;clip:true
        contentWidth:Math.max(1100,availableWidth)
        contentHeight:availableHeight
      ColumnLayout {
        width:workspaceView.contentWidth;height:workspaceView.availableHeight;spacing:12;enabled:root.confirmAction===""
        RowLayout {
          Label {text:"PDF Studio";font.pixelSize:24;font.bold:true;color:Color.popups.text}
          Caption {text:"/  DOCUMENT DESIGNER"}
          Button {text:"Invoices";enabled:!root.busy;onClicked:root.transition("invoices")}
          Button {text:"Close";enabled:!root.busy;onClicked:root.transition("close")}
        }
        RowLayout {
          enabled:!root.busy
          ComboBox {model:["New blank document","New letter","New report","New brochure"];displayText:"New document";onActivated:function(index){root.transition("designNew",{preset:["blank","letter","report","brochure"][index]})}}
          ComboBox {model:["Documents","Templates"];onActivated:function(index){root.showTemplates=index===1;root.list(0)}}
          ComboBox {
            id:savedPicker;Layout.fillWidth:true;model:root.entries;textRole:"title"
            displayText:root.entryTotal ? "Choose saved "+(root.showTemplates?"template":"document")+" ("+(root.entryOffset+1)+"–"+(root.entryOffset+root.entries.length)+" / "+root.entryTotal+")":"Nothing saved yet"
            delegate:ItemDelegate {required property var modelData;width:savedPicker.width;contentItem:Label {text:modelData.title;textFormat:Text.PlainText;color:Color.popups.text;elide:Text.ElideRight}}
            onActivated:function(index){root.transition(root.showTemplates?"designUseTemplate":"designLoad",{id:root.entries[index].id})}
          }
          Button {text:"‹";enabled:root.entryOffset>0;onClicked:root.list(root.entryOffset-50);Accessible.name:"Previous saved documents"}
          Button {text:"›";enabled:root.entryOffset+50<root.entryTotal;onClicked:root.list(root.entryOffset+50);Accessible.name:"Next saved documents"}
          Button {text:"Save";enabled:root.doc!==null;onClicked:root.request("designSave")}
          Button {text:"Save as template";enabled:root.doc!==null;onClicked:root.request("designTemplate")}
        }
        RowLayout {
          enabled:!root.busy && root.doc!==null
          Input {placeholderText:"Document title";text:root.doc?root.doc.title:"";onTextEdited:root.edit("title",text)}
          Caption {Layout.fillWidth:false;text:root.dirty?"Unsaved changes":"Saved / unchanged"}
          Button {text:"Undo";enabled:root.undoStack.length>0;onClicked:root.history(false)}
          Button {text:"Redo";enabled:root.redoStack.length>0;onClicked:root.history(true)}
        }
        RowLayout {
          Layout.fillWidth:true;Layout.fillHeight:true;spacing:16
          ColumnLayout {
            Layout.preferredWidth:220;Layout.maximumWidth:220;Layout.fillHeight:true
            enabled:!root.busy && root.doc!==null
            Caption {text:"BLOCKS · "+(root.doc?root.doc.blocks.length:0)+" / 80"}
            ComboBox {Layout.fillWidth:true;model:root.typeNames;displayText:"+ Add block";onActivated:function(index){root.addBlock(root.types[index])}}
            ListView {
              id:blockList;Layout.fillWidth:true;Layout.fillHeight:true;clip:true;spacing:4;model:root.doc?root.doc.blocks:[]
              ScrollBar.vertical:ScrollBar {}
              delegate:ItemDelegate {
                required property var modelData
                required property int index
                width:blockList.width;highlighted:index===root.selectedIndex
                contentItem:Column {
                  spacing:4
                  Label {width:parent.width;text:(index+1)+"  "+root.typeNames[root.types.indexOf(modelData.type)];color:Color.popups.text;font.bold:true}
                  Label {width:parent.width;text:modelData.text || (modelData.type==="image"?(modelData.asset?"Image imported":"Choose an image"):"");textFormat:Text.PlainText;color:Color.popups.text;opacity:0.65;elide:Text.ElideRight;maximumLineCount:1}
                }
                onClicked:{root.selectedIndex=index;root.editGroup=""}
              }
            }
            RowLayout {
              Button {Layout.preferredWidth:60;Layout.minimumWidth:0;text:"↑";enabled:root.selectedIndex>0;onClicked:root.moveBlock(-1);Accessible.name:"Move block up"}
              Button {Layout.preferredWidth:60;Layout.minimumWidth:0;text:"↓";enabled:root.selected && root.selectedIndex<root.doc.blocks.length-1;onClicked:root.moveBlock(1);Accessible.name:"Move block down"}
              Button {Layout.preferredWidth:80;Layout.minimumWidth:0;text:"Copy";enabled:root.selected!==null;onClicked:root.duplicateBlock()}
            }
            Button {text:"Remove block";Layout.fillWidth:true;enabled:root.selected!==null;onClicked:root.removeBlock()}
          }
          ColumnLayout {
            Layout.fillWidth:true;Layout.fillHeight:true
            RowLayout {
              Caption {text:root.previewStale?"PAGE PREVIEW · NEEDS REFRESH":"PAGE PREVIEW"}
              Button {text:"Refresh";enabled:!root.busy && root.doc!==null;onClicked:root.request("designPreview",{page:root.previewPage})}
            }
            Rectangle {
              Layout.fillWidth:true;Layout.fillHeight:true;color:Qt.rgba(0,0,0,0.18);radius:6
              Image {anchors.fill:parent;anchors.margins:12;source:root.previewUrl;fillMode:Image.PreserveAspectFit;asynchronous:true;cache:false;visible:root.previewUrl!==""}
              Label {anchors.centerIn:parent;width:parent.width-48;horizontalAlignment:Text.AlignHCenter;wrapMode:Text.Wrap;color:Color.popups.text;opacity:0.7;text:"Build your document with blocks.\n\nRefresh to see the rendered PDF here.";visible:root.previewUrl===""}
            }
            RowLayout {
              Layout.alignment:Qt.AlignHCenter
              Button {text:"Previous page";enabled:!root.busy && root.previewPage>1;onClicked:root.request("designPreview",{page:root.previewPage-1})}
              Label {text:root.previewPage+" / "+root.previewPages;color:Color.popups.text}
              Button {text:"Next page";enabled:!root.busy && root.previewPage<root.previewPages;onClicked:root.request("designPreview",{page:root.previewPage+1})}
            }
          }
          ScrollView {
            Layout.preferredWidth:300;Layout.maximumWidth:300;Layout.fillHeight:true;contentWidth:availableWidth;clip:true
            ColumnLayout {
              width:parent.width;spacing:10;enabled:!root.busy && root.doc!==null
              Caption {text:"PAGE SETTINGS"}
              RowLayout {
                ComboBox {Layout.fillWidth:true;model:["A4","Letter"];currentIndex:root.doc?model.indexOf(root.doc.page.size):0;onActivated:root.pageEdit("size",currentText)}
                ComboBox {model:["portrait","landscape"];currentIndex:root.doc?model.indexOf(root.doc.page.orientation):0;onActivated:root.pageEdit("orientation",currentText)}
              }
              Caption {text:"Page margin (pt)"}
              SpinBox {from:16;to:100;value:root.doc?root.doc.page.margin:40;onValueModified:root.pageEdit("margin",value)}
              Caption {text:"Page colour · #RRGGBB"}
              Input {maximumLength:7;text:root.doc?root.doc.page.background:"#ffffff";onTextEdited:root.pageEdit("background",text)}
              Rectangle {Layout.fillWidth:true;height:1;color:Color.popups.border}
              Caption {text:root.selected?root.typeNames[root.types.indexOf(root.selected.type)].toUpperCase()+" PROPERTIES":"Select a block to edit it"}
              ColumnLayout {
                Layout.fillWidth:true;visible:root.selected!==null
                Caption {text:"Text";visible:root.selected && ["heading","text"].indexOf(root.selected.type)>=0}
                CopyArea {visible:root.selected && ["heading","text"].indexOf(root.selected.type)>=0;text:root.selected?root.selected.text || "":"";onEdited:function(value){root.blockEdit("text",value)}}
                Caption {text:"Left column";visible:root.selected && root.selected.type==="columns"}
                CopyArea {visible:root.selected && root.selected.type==="columns";text:root.selected?root.selected.left || "":"";onEdited:function(value){root.blockEdit("left",value)}}
                Caption {text:"Right column";visible:root.selected && root.selected.type==="columns"}
                CopyArea {visible:root.selected && root.selected.type==="columns";text:root.selected?root.selected.right || "":"";onEdited:function(value){root.blockEdit("right",value)}}
                ColumnLayout {
                  Layout.fillWidth:true;visible:root.selected && root.selected.type==="image"
                  Button {text:root.selected && root.selected.asset?"Replace image…":"Import image…";onClicked:{root.importTarget=root.selected.id;imagePicker.open()}}
                  Caption {text:"PNG/JPEG · up to 4 MiB / 12 megapixels. Imported images are copied locally."}
                  Caption {text:"Width (%)"}
                  SpinBox {from:10;to:100;value:root.selected?root.selected.width || 100:100;onValueModified:root.blockEdit("width",value)}
                  Caption {text:"Description"}
                  Input {maximumLength:200;text:root.selected?root.selected.text || "":"";onTextEdited:root.blockEdit("text",text)}
                }
                ColumnLayout {
                  Layout.fillWidth:true;visible:root.selected && root.selected.type==="table"
                  CheckBox {text:"First row is a repeated header";checked:root.selected?root.selected.header || false:false;onToggled:root.blockEdit("header",checked)}
                  RowLayout {
                    Button {text:"+ Row";onClicked:root.tableSize("row",1)}
                    Button {text:"− Row";onClicked:root.tableSize("row",-1)}
                  }
                  RowLayout {
                    Button {text:"+ Column";onClicked:root.tableSize("column",1)}
                    Button {text:"− Column";onClicked:root.tableSize("column",-1)}
                  }
                  Caption {text:"Cells are listed one row at a time. Maximum 40 rows × 6 columns."}
                  Repeater {
                    model:root.selected && root.selected.type==="table"?root.selected.rows.length:0
                    delegate:ColumnLayout {
                      id:tableRow
                      required property int index
                      Layout.fillWidth:true
                      Caption {text:"ROW "+(tableRow.index+1)}
                      Repeater {
                        model:root.selected && root.selected.rows?root.selected.rows[tableRow.index].length:0
                        delegate:Input {required property int index;maximumLength:300;text:root.selected && root.selected.rows?root.selected.rows[tableRow.index][index]:"";onTextEdited:root.tableCell(tableRow.index,index,text)}
                      }
                    }
                  }
                }
                Caption {text:"Height (pt)";visible:root.selected && ["image","spacer","divider"].indexOf(root.selected.type)>=0}
                SpinBox {visible:root.selected && ["image","spacer","divider"].indexOf(root.selected.type)>=0;from:root.selected && root.selected.type==="image"?24:root.selected && root.selected.type==="divider"?1:4;to:root.selected && root.selected.type==="divider"?8:500;value:root.selected?root.selected.height || 24:24;onValueModified:root.blockEdit("height",value)}
                ColumnLayout {
                  Layout.fillWidth:true;visible:root.selected && ["heading","text","columns","table"].indexOf(root.selected.type)>=0
                  Caption {text:"Font family"}
                  ComboBox {Layout.fillWidth:true;model:["sans","serif","mono"];currentIndex:root.selected?model.indexOf(root.selected.font):0;onActivated:root.blockEdit("font",currentText)}
                  RowLayout {
                    SpinBox {from:8;to:48;value:root.selected?root.selected.size:11;onValueModified:root.blockEdit("size",value)}
                    CheckBox {text:"Bold";checked:root.selected?root.selected.bold:false;onToggled:root.blockEdit("bold",checked)}
                  }
                }
                Caption {text:"Colour · #RRGGBB";visible:root.selected && ["image","spacer","pageBreak"].indexOf(root.selected.type)<0}
                Input {visible:root.selected && ["image","spacer","pageBreak"].indexOf(root.selected.type)<0;maximumLength:7;text:root.selected?root.selected.color:"#18212b";onTextEdited:root.blockEdit("color",text)}
                Caption {text:"Alignment";visible:root.selected && ["divider","spacer","pageBreak"].indexOf(root.selected.type)<0}
                ComboBox {visible:root.selected && ["divider","spacer","pageBreak"].indexOf(root.selected.type)<0;Layout.fillWidth:true;model:["left","center","right"];currentIndex:root.selected?model.indexOf(root.selected.align):0;onActivated:root.blockEdit("align",currentText)}
                Caption {text:"Space after block (pt)";visible:root.selected && root.selected.type!=="pageBreak"}
                SpinBox {visible:root.selected && root.selected.type!=="pageBreak";from:0;to:60;value:root.selected?root.selected.spacing:12;onValueModified:root.blockEdit("spacing",value)}
              }
            }
          }
        }
        Label {Layout.fillWidth:true;text:root.status;textFormat:Text.PlainText;wrapMode:Text.Wrap;color:Color.popups.text}
        RowLayout {
          Caption {text:"Local documents · Flow layout · Refresh preview after editing"}
          Button {text:"Open PDF";visible:root.outputUrl!=="";onClicked:if(!Qt.openUrlExternally(root.outputUrl))root.status="Could not open the PDF. Check your default PDF viewer."}
          Button {text:"Export PDF";enabled:!root.busy && root.doc!==null;onClicked:root.request("designExport")}
        }
      }
      }
      Popup {
        id:confirmDialog;anchors.centerIn:parent;visible:root.opened && root.confirmAction!=="";modal:true;focus:true;closePolicy:Popup.NoAutoClose;padding:24
        background:Rectangle {color:Color.popups.background;radius:Style.cornerRadius;border.color:Color.popups.border}
        contentItem:ColumnLayout {
          spacing:16
          Shortcut {sequence:"Escape";enabled:confirmDialog.visible;onActivated:root.confirmAction=""}
          Label {text:"Save your changes?";font.pixelSize:22;color:Color.popups.text}
          Label {text:"This document has unsaved edits.";color:Color.popups.text}
          RowLayout {
            Button {text:"Cancel";onClicked:root.confirmAction=""}
            Button {text:"Discard";onClicked:root.discardChanges()}
            Button {text:"Save";onClicked:root.saveThenContinue()}
          }
        }
      }
    }
  }
}
