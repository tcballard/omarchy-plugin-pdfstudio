import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Hyprland
import qs.Commons
import qs.Ui as Ui

Item {
  id: root
  signal invoicesRequested()
  property bool opened: false
  property var targetScreen: null
  property var doc: null
  property int selectedIndex: -1
  readonly property bool freeLayout: doc!==null && doc.layout==="free"
  property int canvasPage: 1
  property bool showPdf: false
  property bool libraryVisible: false
  property bool layersVisible: false
  property bool pageSettings: false
  property bool frameSettings: false
  property string previewError: ""
  property string assetBaseUrl: ""
  property bool snapToGrid: false
  property real canvasZoom: 1
  property bool fitWidth: true
  onSelectedIndexChanged: {if(selectedIndex>=0)pageSettings=false;if(freeLayout && selected && selected.frame)canvasPage=selected.frame.page}

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
    undoStack=[];redoStack=[];editGroup="";outputUrl="";previewUrl="";previewError="";previewPage=1;previewPages=1;previewStale=false;canvasPage=d.layout==="free" && d.blocks.length?d.blocks[0].frame.page:1;showPdf=false
  }
  function uuid() {return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){var r=Math.floor(Math.random()*16);return (c==="x"?r:(r&3|8)).toString(16)})}
  function change(next,group) {
    if(busy || !doc || confirmAction!=="") return
    if(!group || editGroup!==group) undoStack=undoStack.concat([clone(doc)]).slice(-30)
    editGroup=group || "";coalesce.restart();redoStack=[];doc=next;dirty=true;previewStale=true;outputUrl=""
  }
  function edit(key,value) {var d=clone(doc);d[key]=value;change(d,"document-"+key)}
  function dimensions(d) {var size=d.page.size==="A4"?[595.28,841.89]:[612,792];return d.page.orientation==="landscape"?[size[1],size[0]]:size}
  function fitFrame(f,d) {
    var size=dimensions(d),out=clone(f)
    out.width=Math.max(24,Math.min(size[0],Number(out.width)));out.height=Math.max(12,Math.min(size[1],Number(out.height)))
    out.x=Math.max(0,Math.min(size[0]-out.width,Number(out.x)));out.y=Math.max(0,Math.min(size[1]-out.height,Number(out.y)))
    out.page=Math.max(1,Math.min(d.pageCount,Math.round(Number(out.page))))
    return out
  }
  function pageEdit(key,value) {
    var d=clone(doc);d.page[key]=value
    if(d.layout==="free")d.blocks.forEach(function(b){b.frame=fitFrame(b.frame,d)})
    change(d,"page-"+key)
  }
  function setLayout(free) {
    if(!doc || free===freeLayout)return
    var d=clone(doc)
    if(free){
      var size=dimensions(d),margin=d.page.margin,y=margin,page=1,blocks=[]
      d.schema=2;d.layout="free";d.pageCount=50
      d.blocks.forEach(function(b){
        if(b.type==="pageBreak"){page++;y=margin;return}
        var h=b.type==="heading"?Math.max(48,b.size*2):b.type==="divider"?12:b.type==="spacer"?b.height:b.type==="image"?b.height:b.type==="table"?Math.min(300,b.rows.length*40):140
        h=Math.min(h,size[1]-margin*2)
        if(y+h>size[1]-margin){page++;y=margin}
        b.frame=fitFrame({page:page,x:margin,y:y,width:size[0]-margin*2,height:h},d);blocks.push(b);y+=h+b.spacing
      })
      if(page>50){status="Free layout supports 50 pages. Remove some page breaks or blocks before converting.";return}
      d.blocks=blocks;d.pageCount=page
    }else{
      d.blocks.sort(function(a,b){return a.frame.page-b.frame.page || a.frame.y-b.frame.y || a.frame.x-b.frame.x})
      d.blocks.forEach(function(b){delete b.frame});delete d.layout;delete d.pageCount;d.schema=1
    }
    change(d,"");selectedIndex=d.blocks.length?0:-1;canvasPage=free && d.blocks.length?d.blocks[0].frame.page:1;showPdf=false;previewUrl=""
    status=free?"Free layout · Drag and resize blocks. Preview PDF checks the exact output.":"Flow layout restored in page / top-to-bottom order. Undo restores positioning."
  }
  function commitFrame(index,x,y,w,h) {
    if(!freeLayout || index<0 || index>=doc.blocks.length)return
    var d=clone(doc),f=d.blocks[index].frame
    d.blocks[index].frame=fitFrame({page:f.page,x:x,y:y,width:w,height:h},d)
    change(d,"");selectedIndex=index
  }
  function frameEdit(key,value) {
    if(!freeLayout || !selected)return
    var d=clone(doc),f=d.blocks[selectedIndex].frame;f[key]=value;d.blocks[selectedIndex].frame=fitFrame(f,d)
    change(d,"frame-"+key);canvasPage=d.blocks[selectedIndex].frame.page
  }
  function nudge(dx,dy) {if(!selected || !freeLayout)return;var f=selected.frame;commitFrame(selectedIndex,f.x+dx,f.y+dy,f.width,f.height)}
  function addPage() {if(!freeLayout || doc.pageCount>=50)return;var d=clone(doc);d.pageCount++;change(d,"");canvasPage=d.pageCount;selectedIndex=-1;showPdf=false}
  function removeEmptyPage() {
    if(!freeLayout || doc.pageCount<=1)return
    if(doc.blocks.some(function(b){return b.frame.page===canvasPage})){status="Move or remove this page's blocks first.";return}
    var d=clone(doc);d.blocks.forEach(function(b){if(b.frame.page>canvasPage)b.frame.page--});d.pageCount--;change(d,"");canvasPage=Math.min(canvasPage,d.pageCount);selectedIndex=-1;showPdf=false;previewUrl=""
  }
  function moveLayer(front) {
    if(!selected || !freeLayout)return
    var d=clone(doc),b=d.blocks.splice(selectedIndex,1)[0];if(front)d.blocks.push(b);else d.blocks.unshift(b)
    change(d,"");selectedIndex=front?d.blocks.length-1:0
  }
  function blockEdit(key,value) {
    if(!selected) return
    var d=clone(doc);d.blocks[selectedIndex][key]=value;change(d,selected.id+key)
  }
  function addBlock(type) {
    if(freeLayout && type==="pageBreak"){addPage();return}
    if(!doc || doc.blocks.length>=80 || types.indexOf(type)<0) return
    if(type==="image" && doc.blocks.filter(function(b){return b.type==="image"}).length>=8){status="Use at most eight images.";return}
    var b={id:uuid(),type:type,font:"sans",size:type==="heading"?26:11,bold:type==="heading",color:"#18212b",align:"left",spacing:12}
    if(type==="heading" || type==="text") b.text=type==="heading"?"Your heading":"Write your text here."
    if(type==="columns"){b.left="Left column";b.right="Right column"}
    if(type==="table"){b.rows=[["Item","Details"],["First item","Description"]];b.header=true}
    if(type==="image"){b.asset="";b.width=100;b.height=180;b.text=""}
    if(type==="divider" || type==="spacer")b.height=type==="divider"?1:24
    var d=clone(doc)
    if(freeLayout){var size=dimensions(d);b.frame=fitFrame({page:canvasPage,x:d.page.margin,y:d.page.margin,width:Math.min(280,size[0]-2*d.page.margin),height:type==="heading"?60:type==="divider"?12:140},d)}
    var index=selectedIndex<0?d.blocks.length:selectedIndex+1;d.blocks.splice(index,0,b);change(d,"");selectedIndex=index
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
    var d=clone(doc),b=clone(selected);b.id=uuid();if(freeLayout){b.frame.x+=12;b.frame.y+=12;b.frame=fitFrame(b.frame,d)}d.blocks.splice(selectedIndex+1,0,b);change(d,"");selectedIndex++
  }
  function history(redo) {
    if(busy || !doc || confirmAction!=="")return
    var from=redo?redoStack:undoStack;if(!from.length)return
    var d=clone(from[from.length-1]);d.revision=doc.revision
    if(redo){redoStack=from.slice(0,-1);undoStack=undoStack.concat([clone(doc)]).slice(-30)}
    else {undoStack=from.slice(0,-1);redoStack=redoStack.concat([clone(doc)]).slice(-30)}
    doc=d;selectedIndex=Math.min(selectedIndex,d.blocks.length-1);canvasPage=d.layout==="free"?Math.min(canvasPage,d.pageCount):1;showPdf=false;dirty=true;previewStale=true;outputUrl="";editGroup=""
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
    if(action==="designPreview" || action==="designExport"){previewError="";showPdf=true}
    worker.action=action;worker.payload=serialized;status=action==="designPreview" || action==="designExport" ? "Rendering PDF…":"Working…";worker.running=true
  }
  function failRequest(message) {inFlight=false;responseText="";worker.payload="";queuedAction="";followup.stop();status=String(message || "Operation failed. Your edits are still here.").slice(0,1024);if(worker.action==="designPreview" || worker.action==="designExport")previewError=status}
  function receiveOutput(text) {if(!inFlight)return;responseText=String(text);receivedOutput=true;finishRequest()}
  function receiveExit(code,exitStatus) {if(!inFlight)return;responseCode=code;responseExitStatus=exitStatus;receivedExit=true;finishRequest()}
  function validResponse(r) {
    var a=worker.action
    if(["designNew","designLoad","designSave","designUseTemplate"].indexOf(a)>=0)return r.document && (r.document.schema===1 || r.document.schema===2) && typeof r.document.id==="string" && Number.isSafeInteger(r.document.revision) && typeof r.document.title==="string" && r.document.page && Array.isArray(r.document.blocks) && r.document.blocks.length<=80
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
    if(r.assetBaseUrl)assetBaseUrl=r.assetBaseUrl
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
    if(action==="designPreview" || action==="designExport") {previewError=r.previewError || "";previewUrl=r.previewUrl || "";previewPage=r.page || 1;previewPages=r.pages || 1;previewStale=false;if(freeLayout){showPdf=true;canvasPage=previewPage}}
    status=action==="designSave"?"Document saved":action==="designTemplate"?"Template saved — select Templates to use it":action==="designExport"?(r.previewError || "PDF exported to Documents / PDF Studio"):action==="designPreview"?(r.previewError || "Preview ready"):"Ready"
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
    objectName:"pdfWorker"
    property string action:""
    property string payload:""
    command:["node",root.basePath+"dist/renderer.mjs"]
    environment:({NODE_OPTIONS:null,NODE_PATH:null})
    stdinEnabled:true
    onStarted:{root.helperStarted=true;write(payload+"\n");payload=""}
    stdout:StdioCollector {waitForEnd:true;onStreamFinished:root.receiveOutput(text)}
    onExited:function(code,exitStatus){root.receiveExit(code,exitStatus)}
  }
  component Action: Ui.Button {focusable:true;opacity:enabled?1:0.4;Layout.minimumHeight:32;Accessible.role:Accessible.Button;Accessible.name:text}
  component Caption: Label {color:Color.popups.text;opacity:0.65;font.pixelSize:13;Layout.fillWidth:true;wrapMode:Text.Wrap;textFormat:Text.PlainText}
  component Input: TextField {implicitHeight:34;Layout.fillWidth:true;selectByMouse:true;maximumLength:100}
  component Choice: ComboBox {implicitHeight:32}
  component NumberInput: SpinBox {implicitHeight:32}
  component CopyArea: ScrollView {
    id:copyRoot
    property string text:""
    signal edited(string value)
    background:Rectangle {color:Qt.rgba(0,0,0,0.12);border.color:Color.popups.border}
    Layout.fillWidth:true;Layout.preferredHeight:root.selected && root.selected.type==="heading"?90:150;clip:true
    TextArea {id:area;padding:10;Accessible.name:"Block text";text:copyRoot.text;wrapMode:TextEdit.Wrap;selectByMouse:true;textFormat:TextEdit.PlainText;onTextChanged:if(activeFocus && text!==copyRoot.text)copyRoot.edited(text)}
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
      anchors.fill:parent;padding:16
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
      ColumnLayout {
        anchors.fill:parent;spacing:12;enabled:root.confirmAction===""
        RowLayout {
          Layout.fillWidth:true;spacing:12
          Label {text:"PDF Studio";font.pixelSize:18;font.bold:true;color:Color.popups.text}
          Input {Layout.minimumWidth:80;Accessible.name:"Document title";placeholderText:"Untitled document";text:root.doc?root.doc.title:"";enabled:!root.busy && root.doc!==null;onTextEdited:root.edit("title",text)}
          Label {text:root.dirty?"Edited":"";color:Color.popups.text;opacity:0.6}
          Action {text:"File";enabled:!root.busy;onClicked:fileMenu.open()
            Menu {id:fileMenu;y:parent.height;width:280
              palette.window:Color.popups.background;palette.base:Color.popups.background;palette.text:Color.popups.text;palette.windowText:Color.popups.text;palette.buttonText:Color.popups.text
              background:Rectangle {color:Color.popups.background;border.color:Color.popups.border}
              MenuItem {text:"New blank document";onTriggered:root.transition("designNew",{preset:"blank"})}
              MenuItem {text:"New letter";onTriggered:root.transition("designNew",{preset:"letter"})}
              MenuItem {text:"New report";onTriggered:root.transition("designNew",{preset:"report"})}
              MenuItem {text:"New brochure";onTriggered:root.transition("designNew",{preset:"brochure"})}
              MenuSeparator {}
              MenuItem {text:"Open document or template…";onTriggered:{root.libraryVisible=!root.libraryVisible;if(root.libraryVisible)root.list(0)}}
              MenuItem {text:"Save as template";enabled:root.doc!==null;onTriggered:root.request("designTemplate")}
              MenuSeparator {}
              MenuItem {text:"Invoice editor";onTriggered:root.transition("invoices")}
            }
          }
          Action {text:"Save";enabled:!root.busy && root.doc!==null;onClicked:root.request("designSave")}
          Action {text:"Export PDF";bordered:true;enabled:!root.busy && root.doc!==null;onClicked:root.request("designExport",{page:root.freeLayout?root.canvasPage:root.previewPage})}
          Action {text:"Close";enabled:!root.busy;onClicked:root.transition("close")}
        }
        RowLayout {
          visible:root.libraryVisible;enabled:!root.busy;Layout.fillWidth:true
          Choice {model:["Documents","Templates"];onActivated:function(index){root.showTemplates=index===1;root.list(0)}}
          Choice {
            id:savedPicker;Layout.fillWidth:true;model:root.entries;textRole:"title"
            displayText:root.entryTotal ? "Choose saved "+(root.showTemplates?"template":"document")+" ("+(root.entryOffset+1)+"–"+(root.entryOffset+root.entries.length)+" / "+root.entryTotal+")":"Nothing saved yet"
            delegate:ItemDelegate {required property var modelData;width:savedPicker.width;contentItem:Label {text:modelData.title;textFormat:Text.PlainText;color:Color.popups.text;elide:Text.ElideRight}}
            onActivated:function(index){root.transition(root.showTemplates?"designUseTemplate":"designLoad",{id:root.entries[index].id})}
          }
          Action {text:"‹";enabled:root.entryOffset>0;onClicked:root.list(root.entryOffset-50);Accessible.name:"Previous saved documents"}
          Action {text:"›";enabled:root.entryOffset+50<root.entryTotal;onClicked:root.list(root.entryOffset+50);Accessible.name:"Next saved documents"}
          Action {text:"Done";onClicked:root.libraryVisible=false}
        }
        Rectangle {Layout.fillWidth:true;height:1;color:Color.popups.border}
        RowLayout {
          Layout.fillWidth:true;enabled:!root.busy && root.doc!==null
          Choice {Layout.preferredWidth:150;model:root.typeNames;displayText:"+ Insert";onActivated:function(index){root.addBlock(root.types[index]);root.pageSettings=false}}
          Action {text:"Layers";selected:root.layersVisible;onClicked:root.layersVisible=!root.layersVisible}
          Action {text:"Undo";enabled:root.undoStack.length>0;onClicked:root.history(false)}
          Action {text:"Redo";enabled:root.redoStack.length>0;onClicked:root.history(true)}
          Item {Layout.fillWidth:true}
          Action {text:"Page setup";selected:root.pageSettings;onClicked:root.pageSettings=!root.pageSettings}
        }
        RowLayout {
          Layout.fillWidth:true;Layout.fillHeight:true;spacing:16
          ColumnLayout {
            visible:root.layersVisible;Layout.preferredWidth:160;Layout.maximumWidth:160;Layout.fillHeight:true
            enabled:!root.busy && root.doc!==null
            Caption {text:(root.freeLayout?"LAYERS · BACK TO FRONT · ":"BLOCKS · ")+(root.doc?root.doc.blocks.length:0)+" / 80"}
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
                onClicked:{root.pageSettings=false;root.selectedIndex=index;if(root.freeLayout)root.showPdf=false;root.editGroup=""}
              }
            }
            RowLayout {
              Action {Layout.preferredWidth:40;Layout.minimumWidth:0;text:"↑";enabled:root.selectedIndex>0;onClicked:root.moveBlock(-1);Accessible.name:"Move block up"}
              Action {Layout.preferredWidth:40;Layout.minimumWidth:0;text:"↓";enabled:root.selected && root.selectedIndex<root.doc.blocks.length-1;onClicked:root.moveBlock(1);Accessible.name:"Move block down"}
              Action {Layout.preferredWidth:60;Layout.minimumWidth:0;text:"Copy";enabled:root.selected!==null;onClicked:root.duplicateBlock()}
            }
            RowLayout {
              visible:root.freeLayout
              Action {text:"To back";enabled:root.selected!==null;onClicked:root.moveLayer(false)}
              Action {text:"To front";enabled:root.selected!==null;onClicked:root.moveLayer(true)}
            }
            Action {text:"Remove block";Layout.fillWidth:true;enabled:root.selected!==null;onClicked:root.removeBlock()}
          }
          ColumnLayout {
            Layout.fillWidth:true;Layout.fillHeight:true
            RowLayout {
              Caption {text:root.freeLayout && !root.showPdf?"Canvas":root.previewStale?"PDF preview · changes not rendered":"PDF preview"}
              Action {text:root.previewUrl===""?"Preview PDF":"Update preview";enabled:!root.busy && root.doc!==null;onClicked:root.request("designPreview",{page:root.freeLayout?root.canvasPage:root.previewPage})}
            }
            RowLayout {
              enabled:!root.busy
              Action {visible:root.freeLayout;text:root.showPdf?"Edit canvas":"Show PDF";onClicked:if(root.showPdf)root.showPdf=false;else if(root.previewUrl!=="" && !root.previewStale)root.showPdf=true;else root.request("designPreview",{page:root.canvasPage})}
              CheckBox {visible:root.freeLayout && !root.showPdf;text:"Snap 8 pt";checked:root.snapToGrid;onToggled:root.snapToGrid=checked}
              Choice {Accessible.name:"Page zoom";displayText:root.fitWidth?"Fit width":root.canvasZoom===1 || root.showPdf?"Fit page":root.canvasZoom===1.5?"150%":"200%";model:root.showPdf || !root.freeLayout?["Fit page","Fit width"]:["Fit page","Fit width","150%","200%"];currentIndex:root.fitWidth?1:root.canvasZoom===1?0:root.canvasZoom===1.5?2:3;onActivated:function(index){root.fitWidth=index===1;root.canvasZoom=index<2?1:index===2?1.5:2}}
              Action {visible:root.freeLayout && !root.showPdf;text:"+ Page";enabled:root.doc && root.doc.pageCount<50;onClicked:root.addPage()}
            }
            Rectangle {
              Layout.fillWidth:true;Layout.fillHeight:true;color:Qt.rgba(0,0,0,0.18);radius:6
              PdfPage {
                id:pdfImage;anchors.fill:parent;source:root.previewUrl;fitWidth:root.fitWidth
                visible:status===Image.Ready && !(root.inFlight && (worker.action==="designPreview" || worker.action==="designExport")) && root.previewError==="" && (!root.freeLayout || root.showPdf)
                onStatusChanged:if(status===Image.Error)root.previewError="The PDF was created, but its page image could not be displayed. Try Preview PDF again or open the PDF in your viewer."
              }
              ColumnLayout {
                anchors.centerIn:parent;width:Math.max(100,parent.width-64);spacing:16
                visible:(!root.freeLayout || root.showPdf) && (root.previewError!=="" || pdfImage.status!==Image.Ready || (root.busy && (worker.action==="designPreview" || worker.action==="designExport")))
                Label {Layout.fillWidth:true;horizontalAlignment:Text.AlignHCenter;wrapMode:Text.Wrap;color:Color.popups.text;font.pixelSize:18;text:root.busy?"Rendering your document…":root.previewError!==""?"Preview unavailable":"Your page starts here"}
                Label {Layout.fillWidth:true;horizontalAlignment:Text.AlignHCenter;wrapMode:Text.Wrap;color:Color.popups.text;opacity:0.7;textFormat:Text.PlainText;text:root.previewError || (root.busy?"The PDF will appear here when it is ready.":"Insert text, images or a table, then preview your PDF. For drag-and-drop positioning, choose Free layout in Page setup.")}
                Action {Layout.alignment:Qt.AlignHCenter;text:"Preview PDF";visible:!root.busy;enabled:root.doc!==null;onClicked:root.request("designPreview",{page:root.freeLayout?root.canvasPage:root.previewPage})}
              }
              FreeCanvas {
                id:freeCanvas;anchors.fill:parent;visible:root.freeLayout && !root.showPdf
                enabled:!root.busy && root.confirmAction===""
                document:root.freeLayout?root.doc:null;selectedIndex:root.selectedIndex;page:root.canvasPage
                snap:root.snapToGrid;zoom:root.canvasZoom;fitWidth:root.fitWidth;assetBaseUrl:root.assetBaseUrl
                onSelectBlock:function(index){root.selectedIndex=index}
                onFrameCommitted:function(index,x,y,w,h){root.commitFrame(index,x,y,w,h)}
                onNudge:function(dx,dy){root.nudge(dx,dy)}
                onUndoRequested:function(redo){root.history(redo)}
                onRemoveRequested:root.removeBlock()
                onDuplicateRequested:root.duplicateBlock()
              }
            }
            RowLayout {
              Layout.alignment:Qt.AlignHCenter
              Action {text:"Previous page";enabled:!root.busy && (root.freeLayout && !root.showPdf?root.canvasPage:root.previewPage)>1;onClicked:if(root.freeLayout && !root.showPdf){root.canvasPage--;root.selectedIndex=-1}else root.request("designPreview",{page:root.previewPage-1})}
              Label {text:root.freeLayout && !root.showPdf?root.canvasPage+" / "+root.doc.pageCount:root.previewPage+" / "+root.previewPages;color:Color.popups.text}
              Action {text:"Next page";enabled:!root.busy && (root.freeLayout && !root.showPdf?root.canvasPage<root.doc.pageCount:root.previewPage<root.previewPages);onClicked:if(root.freeLayout && !root.showPdf){root.canvasPage++;root.selectedIndex=-1}else root.request("designPreview",{page:root.previewPage+1})}
            }
          }
          ScrollView {
            Layout.preferredWidth:300;Layout.maximumWidth:300;Layout.fillHeight:true;contentWidth:availableWidth;clip:true
            ScrollBar.horizontal.policy:ScrollBar.AlwaysOff
            ScrollBar.vertical.policy:ScrollBar.AsNeeded
            ScrollBar.vertical.active:true
            ColumnLayout {
              width:parent.width;spacing:10;enabled:!root.busy && root.doc!==null
              RowLayout {
                Action {text:"Content";selected:!root.pageSettings;onClicked:root.pageSettings=false}
                Action {text:"Page";selected:root.pageSettings;onClicked:root.pageSettings=true}
              }
              ColumnLayout {
                Layout.fillWidth:true;visible:root.pageSettings
              Caption {text:"PAGE SETTINGS"}
              Choice {Layout.fillWidth:true;model:["Flow layout","Free layout"];currentIndex:root.freeLayout?1:0;onActivated:function(index){root.setLayout(index===1)}}
              Caption {visible:root.freeLayout;text:"Drag to position; use the corner to resize. Arrow keys move 1 pt, Shift moves 10. Content outside a frame is clipped."}
              Action {visible:root.freeLayout;text:"Remove empty page";onClicked:root.removeEmptyPage()}
              RowLayout {
                Choice {Layout.fillWidth:true;model:["A4","Letter"];currentIndex:root.doc?model.indexOf(root.doc.page.size):0;onActivated:root.pageEdit("size",currentText)}
                Choice {model:["portrait","landscape"];currentIndex:root.doc?model.indexOf(root.doc.page.orientation):0;onActivated:root.pageEdit("orientation",currentText)}
              }
              Caption {text:"Page margin (pt)"}
              NumberInput {from:16;to:100;value:root.doc?root.doc.page.margin:40;onValueModified:root.pageEdit("margin",value)}
              Caption {text:"Page colour · #RRGGBB"}
              Input {maximumLength:7;text:root.doc?root.doc.page.background:"#ffffff";onTextEdited:root.pageEdit("background",text)}
              }
              Caption {visible:!root.pageSettings;text:root.selected?root.typeNames[root.types.indexOf(root.selected.type)].toUpperCase()+" PROPERTIES":"Select a block to edit it"}
              ColumnLayout {
                Layout.fillWidth:true;visible:!root.pageSettings && root.selected!==null
                Caption {text:"Text";visible:root.selected && ["heading","text"].indexOf(root.selected.type)>=0}
                CopyArea {visible:root.selected && ["heading","text"].indexOf(root.selected.type)>=0;text:root.selected?root.selected.text || "":"";onEdited:function(value){root.blockEdit("text",value)}}
                Caption {text:"Left column";visible:root.selected && root.selected.type==="columns"}
                CopyArea {visible:root.selected && root.selected.type==="columns";text:root.selected?root.selected.left || "":"";onEdited:function(value){root.blockEdit("left",value)}}
                Caption {text:"Right column";visible:root.selected && root.selected.type==="columns"}
                CopyArea {visible:root.selected && root.selected.type==="columns";text:root.selected?root.selected.right || "":"";onEdited:function(value){root.blockEdit("right",value)}}
                ColumnLayout {
                  Layout.fillWidth:true;visible:root.selected && root.selected.type==="image"
                  Action {text:root.selected && root.selected.asset?"Replace image…":"Import image…";onClicked:{root.importTarget=root.selected.id;imagePicker.open()}}
                  Caption {text:"PNG/JPEG · up to 4 MiB / 12 megapixels. Imported images are copied locally."}
                  Caption {visible:!root.freeLayout;text:"Width (%)"}
                  NumberInput {visible:!root.freeLayout;from:10;to:100;value:root.selected?root.selected.width || 100:100;onValueModified:root.blockEdit("width",value)}
                  Caption {text:"Description"}
                  Input {maximumLength:200;text:root.selected?root.selected.text || "":"";onTextEdited:root.blockEdit("text",text)}
                }
                ColumnLayout {
                  Layout.fillWidth:true;visible:root.selected && root.selected.type==="table"
                  CheckBox {text:"First row is a repeated header";checked:root.selected?root.selected.header || false:false;onToggled:root.blockEdit("header",checked)}
                  RowLayout {
                    Action {text:"+ Row";onClicked:root.tableSize("row",1)}
                    Action {text:"− Row";onClicked:root.tableSize("row",-1)}
                  }
                  RowLayout {
                    Action {text:"+ Column";onClicked:root.tableSize("column",1)}
                    Action {text:"− Column";onClicked:root.tableSize("column",-1)}
                  }
                  Caption {text:"Edit cells · scroll across for more columns"}
                  ScrollView {
                    Layout.fillWidth:true;Layout.preferredHeight:Math.min(260,root.selected && root.selected.rows?root.selected.rows.length*42+28:100)
                    contentWidth:Math.max(availableWidth,root.selected && root.selected.rows?root.selected.rows[0].length*140:280);clip:true
                    Column {
                      width:parent.width;spacing:4
                      Repeater {
                        model:root.selected && root.selected.type==="table"?root.selected.rows.length:0
                        delegate:Row {
                          id:tableRow;required property int index;spacing:4
                          Repeater {
                            model:root.selected && root.selected.rows && root.selected.rows[tableRow.index]?root.selected.rows[tableRow.index].length:0
                            delegate:Input {
                              required property int index;width:136;maximumLength:300
                              Accessible.name:"Row "+(tableRow.index+1)+", column "+(index+1)
                              text:root.selected && root.selected.rows && root.selected.rows[tableRow.index]?root.selected.rows[tableRow.index][index]:""
                              onTextEdited:root.tableCell(tableRow.index,index,text)
                            }
                          }
                        }
                      }
                    }
                  }
                }
                Caption {text:"Height (pt)";visible:!root.freeLayout && root.selected && ["image","spacer","divider"].indexOf(root.selected.type)>=0}
                NumberInput {visible:!root.freeLayout && root.selected && ["image","spacer","divider"].indexOf(root.selected.type)>=0;from:root.selected && root.selected.type==="image"?24:root.selected && root.selected.type==="divider"?1:4;to:root.selected && root.selected.type==="divider"?8:500;value:root.selected?root.selected.height || 24:24;onValueModified:root.blockEdit("height",value)}
                ColumnLayout {
                  Layout.fillWidth:true;visible:root.selected && ["heading","text","columns","table"].indexOf(root.selected.type)>=0
                  Caption {text:"Font family"}
                  Choice {Accessible.name:"Font family";Layout.fillWidth:true;model:["sans","serif","mono"];currentIndex:root.selected?model.indexOf(root.selected.font):0;onActivated:root.blockEdit("font",currentText)}
                  RowLayout {
                    NumberInput {Accessible.name:"Font size in points";from:8;to:48;value:root.selected?root.selected.size:11;onValueModified:root.blockEdit("size",value)}
                    CheckBox {text:"Bold";checked:root.selected?root.selected.bold:false;onToggled:root.blockEdit("bold",checked)}
                  }
                }
                Caption {text:"Colour · #RRGGBB";visible:root.selected && ["image","spacer","pageBreak"].indexOf(root.selected.type)<0}
                Input {visible:root.selected && ["image","spacer","pageBreak"].indexOf(root.selected.type)<0;Accessible.name:"Text colour, hexadecimal";maximumLength:7;text:root.selected?root.selected.color:"#18212b";onTextEdited:root.blockEdit("color",text)}
                Caption {text:"Alignment";visible:root.selected && ["divider","spacer","pageBreak"].indexOf(root.selected.type)<0}
                Choice {visible:root.selected && ["divider","spacer","pageBreak"].indexOf(root.selected.type)<0;Layout.fillWidth:true;model:["left","center","right"];currentIndex:root.selected?model.indexOf(root.selected.align):0;onActivated:root.blockEdit("align",currentText)}
                Action {visible:root.freeLayout;text:root.frameSettings?"Hide position & size":"Position & size…";onClicked:root.frameSettings=!root.frameSettings}
                ColumnLayout {
                  Layout.fillWidth:true;visible:root.freeLayout && root.frameSettings && root.selected!==null
                  Caption {text:"FRAME · POINTS FROM PAGE TOP LEFT"}
                  RowLayout {
                    Caption {text:"X";Layout.fillWidth:false}
                    NumberInput {from:0;to:842;editable:true;value:root.selected && root.selected.frame?Math.round(root.selected.frame.x):0;onValueModified:root.frameEdit("x",value)}
                    Caption {text:"Y";Layout.fillWidth:false}
                    NumberInput {from:0;to:842;editable:true;value:root.selected && root.selected.frame?Math.round(root.selected.frame.y):0;onValueModified:root.frameEdit("y",value)}
                  }
                  Caption {text:"Width / height"}
                  RowLayout {
                    NumberInput {from:24;to:842;editable:true;value:root.selected && root.selected.frame?Math.round(root.selected.frame.width):24;onValueModified:root.frameEdit("width",value)}
                    NumberInput {from:12;to:842;editable:true;value:root.selected && root.selected.frame?Math.round(root.selected.frame.height):12;onValueModified:root.frameEdit("height",value)}
                  }
                  Caption {text:"Page"}
                  NumberInput {from:1;to:root.freeLayout?root.doc.pageCount:1;value:root.selected && root.selected.frame?root.selected.frame.page:1;onValueModified:root.frameEdit("page",value)}
                }
                Caption {text:"Space after block (pt)";visible:!root.freeLayout && root.selected && root.selected.type!=="pageBreak"}
                NumberInput {visible:!root.freeLayout && root.selected && root.selected.type!=="pageBreak";from:0;to:60;value:root.selected?root.selected.spacing:12;onValueModified:root.blockEdit("spacing",value)}
              }
            }
          }
        }
        Rectangle {Layout.fillWidth:true;height:1;color:Color.popups.border}
        RowLayout {
          Label {Layout.fillWidth:true;text:root.status;textFormat:Text.PlainText;wrapMode:Text.Wrap;maximumLineCount:2;color:Color.popups.text;opacity:0.75}
          Action {text:"Open PDF ↗";visible:root.outputUrl!=="";onClicked:if(!Qt.openUrlExternally(root.outputUrl))root.status="Could not open the PDF. Check your default PDF viewer."}
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
            Action {text:"Cancel";onClicked:root.confirmAction=""}
            Action {text:"Discard";onClicked:root.discardChanges()}
            Action {text:"Save";onClicked:root.saveThenContinue()}
          }
        }
      }
    }
  }
}
