import QtQuick
import QtQuick.Controls

Item {
  id:canvas
  activeFocusOnTab:true
  Accessible.role:Accessible.Pane;Accessible.name:"Document canvas"
  property var document: null
  property int selectedIndex: -1
  property int page: 1
  readonly property var pageBlocks: document?document.blocks.filter(function(b){return b.frame && b.frame.page===canvas.page}):[]
  readonly property color paperColor: document && /^#[0-9a-f]{6}$/i.test(document.page.background)?document.page.background:"white"
  property bool snap: false
  property real zoom: 1
  property bool fitWidth: false
  property string assetBaseUrl: ""
  readonly property real pageWidth: document ? (document.page.orientation==="landscape" ? (document.page.size==="A4"?841.89:792) : (document.page.size==="A4"?595.28:612)) : 595.28
  readonly property real pageHeight: document ? (document.page.orientation==="landscape" ? (document.page.size==="A4"?595.28:612) : (document.page.size==="A4"?841.89:792)) : 841.89
  readonly property real scaleFactor: Math.max(0.1,(fitWidth?(width-32)/pageWidth:Math.min((width-32)/pageWidth,(height-32)/pageHeight)))*zoom
  property string editingId:""
  property string editingKey:"text"
  property string originalText:""
  readonly property bool textEditing:editingId!==""
  readonly property var editingBlock:document?document.blocks.find(function(b){return b.id===canvas.editingId}):null
  signal textEdited(string id,string key,string text)
  function beginEditing(index,key) {
    var b=document.blocks[index]
    if(!b || ["heading","text","columns"].indexOf(b.type)<0)return
    selectBlock(index);editingKey=key || "text";originalText=b[editingKey] || "";editingId=b.id
    inlineText.text=originalText;inlineText.forceActiveFocus();inlineText.selectAll()
  }
  function finishEditing(cancel) {
    if(cancel && editingId!=="")textEdited(editingId,editingKey,originalText)
    editingId=""
  }
  onDocumentChanged:if(editingId!=="" && !editingBlock)finishEditing(false)
  signal selectBlock(int index)
  signal frameCommitted(int index,real x,real y,real w,real h)
  signal nudge(int dx,int dy)
  signal undoRequested(bool redo)
  signal removeRequested()
  signal duplicateRequested()
  function revealSelection() {
    if(!document || selectedIndex<0 || !document.blocks[selectedIndex])return
    var f=document.blocks[selectedIndex].frame
    if(!f || f.page!==page)return
    var top=16+f.y*scaleFactor,bottom=top+f.height*scaleFactor
    if(top<viewport.contentY || bottom>viewport.contentY+viewport.height)
      viewport.contentY=Math.max(0,Math.min(viewport.contentHeight-viewport.height,top-24))
  }
  onSelectedIndexChanged:{if(editingBlock && document.blocks[selectedIndex]!==editingBlock)finishEditing(false);Qt.callLater(revealSelection)}
  onPageChanged:Qt.callLater(revealSelection)
  function bounded(value,min,max) {return Math.max(min,Math.min(max,Math.round(value*10)/10))}
  function snapped(value) {return snap?Math.round(value/8)*8:value}
  Keys.onPressed:function(event) {
    if(textEditing)return
    if(event.key===Qt.Key_Delete || event.key===Qt.Key_Backspace){removeRequested();event.accepted=true;return}
    if(event.key===Qt.Key_D && (event.modifiers & Qt.ControlModifier)){duplicateRequested();event.accepted=true;return}
    var delta=(event.modifiers & Qt.ShiftModifier)?10:1
    if(event.key===Qt.Key_Left){nudge(-delta,0);event.accepted=true}
    else if(event.key===Qt.Key_Right){nudge(delta,0);event.accepted=true}
    else if(event.key===Qt.Key_Up){nudge(0,-delta);event.accepted=true}
    else if(event.key===Qt.Key_Down){nudge(0,delta);event.accepted=true}
    else if(event.key===Qt.Key_Z && (event.modifiers & Qt.ControlModifier)){undoRequested(!!(event.modifiers & Qt.ShiftModifier));event.accepted=true}
  }
  FontLoader {source:Qt.resolvedUrl("renderer/fonts/DejaVuSans.ttf")}
  FontLoader {source:Qt.resolvedUrl("renderer/fonts/DejaVuSans-Bold.ttf")}
  FontLoader {source:Qt.resolvedUrl("renderer/fonts/DejaVuSerif.ttf")}
  FontLoader {source:Qt.resolvedUrl("renderer/fonts/DejaVuSerif-Bold.ttf")}
  FontLoader {source:Qt.resolvedUrl("renderer/fonts/DejaVuSansMono.ttf")}
  FontLoader {source:Qt.resolvedUrl("renderer/fonts/DejaVuSansMono-Bold.ttf")}
  Flickable {
    id:viewport;anchors.fill:parent;clip:true
    contentWidth:Math.max(width,canvas.pageWidth*canvas.scaleFactor+32)
    contentHeight:Math.max(height,canvas.pageHeight*canvas.scaleFactor+32)
    boundsBehavior:Flickable.StopAtBounds
    ScrollBar.horizontal:ScrollBar {}
    ScrollBar.vertical:ScrollBar {}
    Rectangle {
      id:paper
      objectName:"freePaper"
      x:(viewport.contentWidth-width)/2;y:(viewport.contentHeight-height)/2
      width:canvas.pageWidth*canvas.scaleFactor;height:canvas.pageHeight*canvas.scaleFactor
      color:canvas.paperColor
      Item {
        id:coordinates;width:canvas.pageWidth;height:canvas.pageHeight
        scale:canvas.scaleFactor;transformOrigin:Item.TopLeft
        Rectangle {
          x:canvas.document?canvas.document.page.margin:40;y:x
          width:parent.width-2*x;height:parent.height-2*y
          color:"transparent";border.color:"#557f8c8d";border.width:1/canvas.scaleFactor
        }
        MouseArea {anchors.fill:parent;onClicked:{canvas.selectBlock(-1);canvas.forceActiveFocus()}}
        Repeater {
          model:canvas.pageBlocks
          delegate:Item {
            id:box
            required property var modelData
            required property int index
            readonly property int sourceIndex:canvas.document?canvas.document.blocks.findIndex(function(b){return b.id===box.modelData.id}):-1
            objectName:"freeBlock-"+sourceIndex
            property var liveFrame:null
            readonly property var frame:liveFrame || modelData.frame || ({x:0,y:0,width:24,height:12,page:1})
            readonly property bool chosen:sourceIndex===canvas.selectedIndex
            readonly property color ink: /^#[0-9a-f]{6}$/i.test(modelData.color)?modelData.color:"#18212b"
            x:frame.x;y:frame.y;width:frame.width;height:frame.height
            visible:frame.page===canvas.page
            Item {
              anchors.fill:parent;clip:true
              Text {
                anchors.fill:parent
                visible:["heading","text"].indexOf(box.modelData.type)>=0 && canvas.editingId!==box.modelData.id
                text:box.modelData.text || "";textFormat:Text.PlainText;wrapMode:Text.Wrap
                font.family:box.modelData.font==="serif"?"DejaVu Serif":box.modelData.font==="mono"?"DejaVu Sans Mono":"DejaVu Sans"
                font.pixelSize:box.modelData.size;font.bold:box.modelData.bold
                color:box.ink
                horizontalAlignment:box.modelData.align==="center"?Text.AlignHCenter:box.modelData.align==="right"?Text.AlignRight:Text.AlignLeft
              }
              Row {
                anchors.fill:parent;visible:box.modelData.type==="columns";spacing:20
                Repeater {
                  model:[box.modelData.left || "",box.modelData.right || ""]
                  Text {
                    required property string modelData
                    opacity:canvas.editingId!==box.modelData.id || canvas.editingKey!==(index===0?"left":"right")?1:0
                    required property int index
                    width:Math.max(1,(box.width-20)/2);height:box.height;text:modelData;textFormat:Text.PlainText;wrapMode:Text.Wrap
                    font.family:box.modelData.font==="serif"?"DejaVu Serif":box.modelData.font==="mono"?"DejaVu Sans Mono":"DejaVu Sans"
                    font.pixelSize:box.modelData.size;font.bold:box.modelData.bold;color:box.ink
                    horizontalAlignment:box.modelData.align==="center"?Text.AlignHCenter:box.modelData.align==="right"?Text.AlignRight:Text.AlignLeft
                  }
                }
              }
              Image {
                anchors.fill:parent;visible:box.modelData.type==="image"
                source:box.modelData.asset && canvas.assetBaseUrl?canvas.assetBaseUrl+box.modelData.asset:""
                fillMode:Image.PreserveAspectFit;verticalAlignment:Image.AlignTop
                horizontalAlignment:box.modelData.align==="center"?Image.AlignHCenter:box.modelData.align==="right"?Image.AlignRight:Image.AlignLeft
                asynchronous:true
              }
              Rectangle {anchors.fill:parent;visible:box.modelData.type==="divider";color:box.ink}
              Column {
                width:parent.width;visible:box.modelData.type==="table"
                Repeater {
                  model:box.modelData.rows || []
                  Row {
                    id:tableRow
                    required property var modelData
                    required property int index
                    width:parent.width
                    Repeater {
                      model:tableRow.modelData
                      Rectangle {
                        required property string modelData
                        width:box.width/tableRow.modelData.length;height:cell.implicitHeight+14
                        color:box.modelData.header && tableRow.index===0?"#edf0f3":canvas.paperColor
                        border.width:0.5;border.color:"#c7ccd1"
                        Text {
                          id:cell;x:7;y:7;width:Math.max(1,parent.width-14);text:parent.modelData || " ";wrapMode:Text.Wrap;textFormat:Text.PlainText
                          font.family:box.modelData.font==="serif"?"DejaVu Serif":box.modelData.font==="mono"?"DejaVu Sans Mono":"DejaVu Sans"
                          font.pixelSize:box.modelData.size;font.bold:box.modelData.bold || (box.modelData.header && tableRow.index===0);color:box.ink
                        }
                      }
                    }
                  }
                }
              }
              Text {anchors.centerIn:parent;visible:box.modelData.type==="image" && !box.modelData.asset;text:"Import an image";font.pixelSize:12;color:"#59636c"}
            }
            Rectangle {anchors.fill:parent;color:"transparent";border.color:box.chosen?"#1689df":"#558596a4";border.width:(box.chosen?2:1)/canvas.scaleFactor}
            MouseArea {
              id:moveArea;anchors.fill:parent;preventStealing:true;cursorShape:pressed?Qt.ClosedHandCursor:Qt.OpenHandCursor
              onDoubleClicked:function(mouse){canvas.beginEditing(box.sourceIndex,box.modelData.type==="columns"?(mouse.x<box.width/2?"left":"right"):"text")}
              property point start
              property var initial
              onPressed:function(mouse){canvas.selectBlock(box.sourceIndex);canvas.forceActiveFocus();initial=JSON.parse(JSON.stringify(box.frame));start=mapToItem(coordinates,mouse.x,mouse.y)}
              onPositionChanged:function(mouse){
                if(!pressed)return
                var point=mapToItem(coordinates,mouse.x,mouse.y),f=JSON.parse(JSON.stringify(initial))
                f.x=canvas.bounded(canvas.snapped(initial.x+point.x-start.x),0,canvas.pageWidth-f.width)
                f.y=canvas.bounded(canvas.snapped(initial.y+point.y-start.y),0,canvas.pageHeight-f.height)
                box.liveFrame=f
              }
              onReleased:{var f=box.frame,i=box.sourceIndex;box.liveFrame=null;if(f.x!==initial.x || f.y!==initial.y)canvas.frameCommitted(i,f.x,f.y,f.width,f.height)}
              onCanceled:box.liveFrame=null
            }
            Rectangle {
              visible:box.chosen;width:12/canvas.scaleFactor;height:width;x:parent.width-width/2;y:parent.height-height/2
              color:"#1689df";border.color:"white";border.width:1/canvas.scaleFactor
              MouseArea {
                objectName:"resizeHandle-"+box.sourceIndex
                anchors.fill:parent;anchors.margins:-6/canvas.scaleFactor;preventStealing:true;cursorShape:Qt.SizeFDiagCursor
                property point start
                property var initial
                onPressed:function(mouse){canvas.forceActiveFocus();initial=JSON.parse(JSON.stringify(box.frame));start=mapToItem(coordinates,mouse.x,mouse.y)}
                onPositionChanged:function(mouse){
                  if(!pressed)return
                  var point=mapToItem(coordinates,mouse.x,mouse.y),f=JSON.parse(JSON.stringify(initial))
                  f.width=canvas.bounded(canvas.snapped(initial.width+point.x-start.x),24,canvas.pageWidth-f.x)
                  f.height=canvas.bounded(canvas.snapped(initial.height+point.y-start.y),12,canvas.pageHeight-f.y)
                  box.liveFrame=f
                }
                onReleased:{var f=box.frame,i=box.sourceIndex;box.liveFrame=null;if(f.width!==initial.width || f.height!==initial.height)canvas.frameCommitted(i,f.x,f.y,f.width,f.height)}
                onCanceled:box.liveFrame=null
              }
            }
          }
        }
        Item {
          id:inlineFrame;z:1000;visible:canvas.textEditing && canvas.editingBlock!==null
          readonly property var b:canvas.editingBlock
          readonly property var f:b && b.frame?b.frame:({x:0,y:0,width:1,height:1})
          x:f.x+(canvas.editingKey==="right"?(f.width+20)/2:0);y:f.y
          width:b && b.type==="columns"?(f.width-20)/2:f.width;height:f.height
          Rectangle {anchors.fill:parent;color:canvas.paperColor;border.color:"#1689df";border.width:2/canvas.scaleFactor}
          TextEdit {
            id:inlineText;objectName:"canvasTextEditor";anchors.fill:parent;clip:true
            textFormat:TextEdit.PlainText;wrapMode:TextEdit.Wrap;selectByMouse:true
            color:inlineFrame.b?inlineFrame.b.color:"#18212b"
            font.family:inlineFrame.b && inlineFrame.b.font==="serif"?"DejaVu Serif":inlineFrame.b && inlineFrame.b.font==="mono"?"DejaVu Sans Mono":"DejaVu Sans"
            font.pixelSize:inlineFrame.b?inlineFrame.b.size:11;font.bold:inlineFrame.b?inlineFrame.b.bold:false
            horizontalAlignment:inlineFrame.b && inlineFrame.b.align==="center"?Text.AlignHCenter:inlineFrame.b && inlineFrame.b.align==="right"?Text.AlignRight:Text.AlignLeft
            Accessible.name:"Edit text on page"
            onTextChanged:if(activeFocus && canvas.textEditing){if(text.length>4000){text=text.slice(0,4000);return}canvas.textEdited(canvas.editingId,canvas.editingKey,text)}
            onActiveFocusChanged:if(!activeFocus && canvas.textEditing)canvas.finishEditing(false)
            Keys.onEscapePressed:function(event){canvas.finishEditing(true);canvas.forceActiveFocus();event.accepted=true}
            Keys.onPressed:function(event){if((event.key===Qt.Key_Return || event.key===Qt.Key_Enter) && (event.modifiers & Qt.ControlModifier)){canvas.finishEditing(false);canvas.forceActiveFocus();event.accepted=true}}
          }
        }
      }
    }
  }
}
