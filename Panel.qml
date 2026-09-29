import QtQuick

Item {
  id: root
  property string omarchyPath: ""
  property var shell: null
  property var manifest: null
  property bool invoices: false
  readonly property bool opened: designer.opened || invoice.opened
  function open(payloadJson) {
    if(invoices) invoice.open(payloadJson)
    else designer.open(payloadJson)
  }
  function close() {designer.close();invoice.close()}
  Designer {
    id: designer
    onInvoicesRequested: {root.invoices=true;invoice.open("{}")}
  }
  InvoicePanel {
    id: invoice
    omarchyPath: root.omarchyPath
    shell: root.shell
    manifest: root.manifest
    onDesignerRequested: {root.invoices=false;designer.open("{}")}
  }
}
