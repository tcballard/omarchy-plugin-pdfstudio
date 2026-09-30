import QtQuick
import QtQuick.Controls

Item {
  id:root
  property alias source:page.source
  property alias status:page.status
  property bool fitWidth:false
  Flickable {
    id:viewport;anchors.fill:parent;clip:true
    contentWidth:width;contentHeight:Math.max(height,page.height+40)
    boundsBehavior:Flickable.StopAtBounds
    ScrollBar.vertical:ScrollBar {}
    Image {
      id:page;objectName:"pdfImage"
      readonly property real ratio:sourceSize.height>0?sourceSize.width/sourceSize.height:0.707
      width:Math.max(1,root.fitWidth?viewport.width-40:Math.min(viewport.width-40,(viewport.height-40)*ratio))
      height:width/ratio
      x:(viewport.width-width)/2;y:Math.max(20,(viewport.height-height)/2)
      fillMode:Image.PreserveAspectFit;asynchronous:true;cache:false
      onSourceChanged:viewport.contentY=0
      Accessible.role:Accessible.Graphic;Accessible.name:"Rendered PDF page"
    }
  }
}
