"""Real Qt controls and keyboard events; Quickshell/Wayland surfaces are stubbed.

Run with PySide6-Essentials 6.8.3. This verifies popup shortcut scope, not host IPC.
"""
import os
import pathlib
import tempfile
import sys
import shutil
import json
import subprocess

os.environ['QT_QPA_PLATFORM'] = 'offscreen'
os.environ['QT_QUICK_BACKEND'] = 'software'
from PySide6.QtCore import QUrl, QMetaObject, Q_ARG, QObject, Qt, qInstallMessageHandler, QPointF, QPoint
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
    designer = '--designer' in sys.argv
    (fixture / 'FreeCanvas.qml').write_text((root / 'FreeCanvas.qml').read_text())
    shutil.copytree(root / 'renderer/fonts', fixture / 'renderer/fonts')
    source = (root / ('Designer.qml' if designer else 'InvoicePanel.qml')).read_text()
    # Keep all production controls, bindings and handlers. Replace only host
    # imports, window type and layer-shell attached properties.
    source = '\n'.join(line for line in source.splitlines()
                       if not line.startswith('import Quickshell')
                       and line != 'import qs.Commons'
                       and 'WlrLayershell.' not in line and 'exclusionMode:' not in line)
    source = source.replace('import qs.Ui as Ui', 'import "ui" as Ui')
    (fixture / 'ui').mkdir()
    (fixture / 'ui/Button.qml').write_text('''import QtQuick.Controls
Button {property bool focusable:true;property bool bordered:false;property bool selected:false}''')
    source = source.replace('PanelWindow {', 'Window {')
    source = source.replace('implicitWidth:', 'width:')
    source = source.replace('implicitHeight:', 'height:')
    (fixture / 'InvoicePanel.qml').write_text(source)
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
    component = QQmlComponent(engine, QUrl.fromLocalFile(str(fixture / 'InvoicePanel.qml')))
    panel = component.create()
    assert panel is not None, [error.toString() for error in component.errors()]
    draft = dict(id='00000000-0000-4000-8000-000000000000', revision=1, number='INV-1',
                 date='2026-09-29', due='2026-09-29', company='Example', companyAddress='',
                 customer='Customer', customerAddress='', currency='GBP', taxRate='20',
                 payment='', notes='', items=[dict(description='Work', quantity='2.5', price='120.00')])
    if designer:
        draft = dict(schema=1,id=draft['id'],revision=0,title='Test document',template=False,
                     page=dict(size='A4',orientation='portrait',margin=40,background='#ffffff'),blocks=[])
    QMetaObject.invokeMethod(panel, 'setDoc', Q_ARG('QVariant', draft))
    panel.setProperty('opened', True)
    panel.setProperty('dirty', True)
    window = panel.findChildren(QQuickWindow)[0]
    # A native Window nested in a detached Item has no visible parent scene.
    # Quickshell owns its surface separately; detach our replacement likewise.
    window.setParent(None)
    if designer:
        window.setWidth(1280)
        window.setHeight(850)
    window.show()
    window.requestActivate()
    QTest.qWait(100)
    def visual_item(item, name):
        if item.objectName() == name:
            return item
        for child in item.childItems():
            found = visual_item(child, name)
            if found is not None:
                return found
        return None
    if designer:
        for kind in ['heading','text','columns','table','image','divider','spacer','pageBreak']:
            QMetaObject.invokeMethod(panel, 'addBlock', Q_ARG('QVariant', kind))
            QTest.qWait(20)
        assert len(panel.property('doc').toVariant()['blocks']) == 8, (panel.property('doc').toVariant(),messages)
        QMetaObject.invokeMethod(panel, 'history', Q_ARG('QVariant', False))
        assert len(panel.property('doc').toVariant()['blocks']) == 7
        QMetaObject.invokeMethod(panel, 'history', Q_ARG('QVariant', True))
        assert len(panel.property('doc').toVariant()['blocks']) == 8, (panel.property('doc').toVariant(),messages)
        panel.setProperty('selectedIndex', 1)
        QTest.qWait(20)
        # Real TextArea input must update the selected block without losing focus.
        area = next(obj for obj in panel.findChildren(QObject)
                    if obj.metaObject().className().startswith('TextArea') and obj.property('visible'))
        QMetaObject.invokeMethod(area, 'forceActiveFocus')
        QTest.keyClick(window, Qt.Key_A, Qt.ControlModifier)

        for letter in 'free design':
            QTest.keyClick(window, Qt.Key(ord(letter.upper())))
        assert panel.property('doc').toVariant()['blocks'][1]['text'] == 'free design'
        panel.setProperty('selectedIndex', 3)
        QTest.qWait(20)
        QMetaObject.invokeMethod(panel, 'tableCell', Q_ARG('QVariant', 1), Q_ARG('QVariant', 1), Q_ARG('QVariant', 'Updated cell'))
        assert panel.property('doc').toVariant()['blocks'][3]['rows'][1][1] == 'Updated cell'
        if '--free' in sys.argv:
            QMetaObject.invokeMethod(panel, 'setLayout', Q_ARG('QVariant', True))
            QTest.qWait(50)
            # Only keep the first heading to give the pointer an unobstructed target.
            d = panel.property('doc').toVariant()
            d['blocks'] = d['blocks'][:1]
            d['blocks'][0]['frame'] = dict(page=1,x=70,y=90,width=260,height=70)
            QMetaObject.invokeMethod(panel, 'setDoc', Q_ARG('QVariant', d))
            QTest.qWait(50)
            box = visual_item(window.contentItem(), 'freeBlock-0')
            assert box is not None and box.property('visible'), (panel.property('doc').toVariant(), [(o.objectName(),o.property('visible')) for o in panel.findChildren(QObject) if o.objectName().startswith('free')],messages)
            origin = box.mapToScene(QPointF(30,30)).toPoint()
            scale = box.mapToScene(QPointF(1,0)).x() - box.mapToScene(QPointF(0,0)).x()
            QTest.mousePress(window, Qt.LeftButton, Qt.NoModifier, origin)
            QTest.mouseMove(window, origin+QPoint(45,35), 30)
            QTest.mouseRelease(window, Qt.LeftButton, Qt.NoModifier, origin+QPoint(45,35))
            QTest.qWait(50)
            moved = panel.property('doc').toVariant()['blocks'][0]['frame']
            assert abs(moved['x']-70-45/scale)<2, moved
            assert abs(moved['y']-90-35/scale)<2, moved
            # A whole gesture is one undo operation.
            QMetaObject.invokeMethod(panel, 'history', Q_ARG('QVariant', False))
            assert panel.property('doc').toVariant()['blocks'][0]['frame']['x'] == 70
            QMetaObject.invokeMethod(panel, 'history', Q_ARG('QVariant', True))
            QTest.qWait(30)
            handle = visual_item(window.contentItem(), 'resizeHandle-0')
            point = handle.mapToScene(QPointF(handle.property('width')/2,handle.property('height')/2)).toPoint()
            QTest.mousePress(window, Qt.LeftButton, Qt.NoModifier, point)
            QTest.mouseMove(window, point+QPoint(40,30), 30)
            QTest.mouseRelease(window, Qt.LeftButton, Qt.NoModifier, point+QPoint(40,30))
            QTest.qWait(30)
            resized = panel.property('doc').toVariant()['blocks'][0]['frame']
            assert resized['width'] > moved['width']+20, resized
            assert resized['height'] > moved['height']+20, resized
            QTest.keyClick(window, Qt.Key_Right)
            assert panel.property('doc').toVariant()['blocks'][0]['frame']['x'] == resized['x']+1
            panel.setProperty('canvasZoom', 2)
            panel.setProperty('snapToGrid', True)
            QTest.qWait(30)
            box = visual_item(window.contentItem(), 'freeBlock-0')
            point = box.mapToScene(QPointF(20,20)).toPoint()
            QTest.mousePress(window, Qt.LeftButton, Qt.NoModifier, point)
            QTest.mouseMove(window, point+QPoint(18,17), 30)
            QTest.mouseRelease(window, Qt.LeftButton, Qt.NoModifier, point+QPoint(18,17))
            QTest.qWait(30)
            snapped = panel.property('doc').toVariant()['blocks'][0]['frame']
            assert snapped['x'] % 8 == 0 and snapped['y'] % 8 == 0, snapped
            window.grabWindow().save('/tmp/pdfstudio-free-qt.png')
        window.grabWindow().save('/tmp/pdfstudio-designer-qt.png')
        # Real shipped renderer -> production response handlers -> Qt image decoder.
        # Only the Quickshell Process transport is replaced here.
        preview_doc = panel.property('doc').toVariant()
        preview_doc['blocks'] = preview_doc['blocks'][:1]
        QMetaObject.invokeMethod(panel, 'setDoc', Q_ARG('QVariant', preview_doc))
        worker = panel.findChild(QObject, 'pdfWorker')
        for action in ['designPreview','designExport']:
            QMetaObject.invokeMethod(panel, 'request', Q_ARG('QVariant', action), Q_ARG('QVariant', {'page':1}))
            response = subprocess.run(['node', str(root / 'dist/renderer.mjs')],
                input=json.dumps(dict(action=action,document=preview_doc,page=1))+'\n',
                env={**os.environ,'HOME':directory,'XDG_DATA_HOME':directory+'/data','XDG_CACHE_HOME':directory+'/cache'},
                text=True,capture_output=True,check=True,timeout=30).stdout
            assert json.loads(response).get('previewUrl'), response
            worker.setProperty('running', False)
            QMetaObject.invokeMethod(panel, 'receiveOutput', Q_ARG('QVariant', response))
            QMetaObject.invokeMethod(panel, 'receiveExit', Q_ARG('QVariant', 0), Q_ARG('QVariant', 0))
            pdf_image = visual_item(window.contentItem(), 'pdfImage')
            for _ in range(100):
                QTest.qWait(20)
                if pdf_image.property('progress') == 1: break
            assert pdf_image.property('visible') and pdf_image.property('progress') == 1, messages
            assert panel.property('previewError') == '', messages
            window.grabWindow().save('/tmp/pdfstudio-preview-qt.png')
        # At laptop logical sizes the canvas and inspector remain within the window.
        window.setWidth(1024);window.setHeight(720);QTest.qWait(30)
        assert pdf_image.width()>300
        assert pdf_image.mapToScene(QPointF(pdf_image.width(),0)).x()<window.width()
        window.grabWindow().save('/tmp/pdfstudio-compact-qt.png')
        panel.setProperty('previewUrl', QUrl.fromLocalFile(directory+'/missing.png').toString())
        QTest.qWait(100)
        assert 'could not be displayed' in panel.property('previewError')
        assert panel.property('outputUrl').endswith('.pdf')
        assert any('missing.png' in message for message in messages), messages
        messages[:] = [message for message in messages if 'missing.png' not in message]
        panel.setProperty('dirty', True)
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
    assert panel.property('doc').toVariant()['id'] == draft['id']
    assert not messages, messages
    window.close()
    print('PASS: Qt popup takes focus, contains Tab, blocks Ctrl+S and cancels on Escape')
