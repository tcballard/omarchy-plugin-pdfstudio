"""Real Qt controls and keyboard events; Quickshell/Wayland surfaces are stubbed.

Run with PySide6-Essentials 6.8.3. This verifies popup shortcut scope, not host IPC.
"""
import os
import pathlib
import tempfile

os.environ['QT_QPA_PLATFORM'] = 'offscreen'
os.environ['QT_QUICK_BACKEND'] = 'software'
from PySide6.QtCore import QUrl, QMetaObject, Q_ARG, QObject, Qt, qInstallMessageHandler
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlEngine, QQmlComponent
from PySide6.QtQuick import QQuickWindow
from PySide6.QtTest import QTest

app = QGuiApplication([])
messages = []
qInstallMessageHandler(lambda kind, context, message: messages.append(message))
root = pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='pdfstudio-qt-') as directory:
    fixture = pathlib.Path(directory)
    source = (root / 'Panel.qml').read_text()
    # Keep all production controls, bindings and handlers. Replace only host
    # imports, window type and layer-shell attached properties.
    source = '\n'.join(line for line in source.splitlines()
                       if not line.startswith('import Quickshell')
                       and line != 'import qs.Commons'
                       and 'WlrLayershell.' not in line and 'exclusionMode:' not in line)
    source = source.replace('PanelWindow {', 'Window {')
    source = source.replace('implicitWidth: Math.min', 'width: Math.min')
    source = source.replace('implicitHeight: Math.min', 'height: Math.min')
    (fixture / 'Panel.qml').write_text(source)
    (fixture / 'qmldir').write_text('singleton Color 1.0 Color.qml\nsingleton Style 1.0 Style.qml\n')
    (fixture / 'Color.qml').write_text('''pragma Singleton
import QtQuick
QtObject {property var popups: ({background:"#222222",text:"#ffffff",border:"#555555"})}''')
    (fixture / 'Style.qml').write_text('''pragma Singleton
import QtQuick
QtObject {property int cornerRadius:12}''')
    (fixture / 'Process.qml').write_text('''import QtQuick
QtObject {
 property bool running:false;property var command:[];property var environment:({})
 property bool stdinEnabled:false;property QtObject stdout
 signal started();signal exited(int code,int exitStatus)
 function write(data) {} function signal(n) {}
}''')
    (fixture / 'StdioCollector.qml').write_text('''import QtQuick
QtObject {property bool waitForEnd:false;property string text:"";signal streamFinished()}''')
    engine = QQmlEngine()
    component = QQmlComponent(engine, QUrl.fromLocalFile(str(fixture / 'Panel.qml')))
    panel = component.create()
    assert panel is not None, [error.toString() for error in component.errors()]
    draft = dict(id='00000000-0000-4000-8000-000000000000', revision=1, number='INV-1',
                 date='2026-09-29', due='2026-09-29', company='Example', companyAddress='',
                 customer='Customer', customerAddress='', currency='GBP', taxRate='20',
                 payment='', notes='', items=[dict(description='Work', quantity='2.5', price='120.00')])
    QMetaObject.invokeMethod(panel, 'setDoc', Q_ARG('QVariant', draft))
    panel.setProperty('opened', True)
    panel.setProperty('dirty', True)
    window = panel.findChildren(QQuickWindow)[0]
    # A native Window nested in a detached Item has no visible parent scene.
    # Quickshell owns its surface separately; detach our replacement likewise.
    window.setParent(None)
    window.show()
    window.requestActivate()
    QTest.qWait(100)
    panel.setProperty('confirmAction', 'close')
    QTest.qWait(30)
    popup = next(obj for obj in panel.findChildren(QObject)
                 if obj.property('modal') is True and obj.property('visible') is True)
    popup_item = window.activeFocusItem()
    assert popup_item is not None and popup.property('activeFocus'), 'Popup did not take focus'
    for _ in range(8):
        QTest.keyClick(window, Qt.Key_Tab)
        focused = window.activeFocusItem()
        assert focused is not None and (focused == popup_item or popup_item.isAncestorOf(focused)), 'Tab escaped the popup'
    QTest.keyClick(window, Qt.Key_S, Qt.ControlModifier)
    assert not panel.property('inFlight'), 'Ctrl+S bypassed the confirmation'
    QTest.keyClick(window, Qt.Key_Escape)
    QTest.qWait(30)
    assert panel.property('confirmAction') == '', 'Escape did not cancel the popup'
    assert panel.property('opened') and panel.property('dirty'), 'Cancel changed or closed the draft'
    assert panel.property('doc').toVariant()['number'] == draft['number']
    assert not messages, messages
    window.close()
    print('PASS: Qt popup takes focus, contains Tab, blocks Ctrl+S and cancels on Escape')
