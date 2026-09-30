"""Capture native Qt UX flows with the shipped renderer and optional real Omarchy Ui.

python tests/ux-audit.py --output docs/ux-audit/before --host ../omarchy-upstream
Only layer-shell/Process transport and the live palette are substituted.
"""
import os, sys, json, shutil, tempfile, subprocess, pathlib, argparse
os.environ['QT_QPA_PLATFORM']='offscreen'
os.environ['QT_QUICK_BACKEND']='software'
from PySide6.QtCore import QUrl, QMetaObject, Q_ARG, QObject, Qt, QPointF
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlEngine, QQmlComponent
from PySide6.QtQuick import QQuickWindow
from PySide6.QtTest import QTest
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--host',required=True)
args=parser.parse_args();out=pathlib.Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
repo=pathlib.Path(__file__).resolve().parents[1];host=pathlib.Path(args.host).resolve()/'shell'
app=QGuiApplication([])
with tempfile.TemporaryDirectory(prefix='pdfstudio-ux-') as directory:
    fixture=pathlib.Path(directory);(fixture/'ui').mkdir();(fixture/'Commons').mkdir()
    def clean(source):
        return '\n'.join(line for line in source.splitlines() if not line.startswith('import Quickshell') and line!='import qs.Commons' and 'WlrLayershell.' not in line and 'exclusionMode:' not in line)
    for name in ['Designer','InvoicePanel']:
        source=clean((repo/(name+'.qml')).read_text()).replace('import qs.Ui as Ui','import "ui" as Ui').replace('PanelWindow {','Window {').replace('    implicitWidth:','    width:').replace('    implicitHeight:','    height:')
        (fixture/(name+'.qml')).write_text(source)
    shutil.copy(repo/'FreeCanvas.qml',fixture/'FreeCanvas.qml');shutil.copy(repo/'PdfPage.qml',fixture/'PdfPage.qml');shutil.copytree(repo/'renderer/fonts',fixture/'renderer/fonts')
    # Real upstream Button, border rendering and style computations; no live daemon/config.
    for name in ['Button','BorderSurface','BorderOverlay']:
        (fixture/'ui'/(name+'.qml')).write_text((host/'Ui'/(name+'.qml')).read_text().replace('import qs.Commons','import ".."'))
    shutil.copy(host/'Commons/BorderGeometry.js',fixture/'Commons/BorderGeometry.js')
    shutil.copy(host/'Commons/BorderGeometry.js',fixture/'BorderGeometry.js')
    shutil.copy(host/'Commons/Border.qml',fixture/'Border.qml')
    style=clean((host/'Commons/Style.qml').read_text()).replace('Quickshell.env("OMARCHY_MENU_FONT")','""').split('  property Process hyprctlProc:')[0]+'\n}'
    (fixture/'Style.qml').write_text(style)
    (fixture/'Util.qml').write_text('''pragma Singleton
import QtQuick
QtObject {
 function clampAlpha(v){return Math.max(0,Math.min(1,v))}
 function alpha(c,a){if(typeof c==="string")c=Qt.color(c);return Qt.rgba(c.r,c.g,c.b,clampAlpha(a))}
}''')
    (fixture/'Color.qml').write_text('''pragma Singleton
import QtQuick
QtObject {
 property color foreground:"#e4e4e7";property color background:"#202124";property color accent:"#82aaff";property color urgent:"#ff757f"
 property var shellValues:({})
 property var popups:({background:"#202124",text:"#e4e4e7",border:"#41434a"})
 property var tooltip:popups
}''')
    (fixture/'qmldir').write_text('\n'.join('singleton '+n+' 1.0 '+n+'.qml' for n in ['Color','Style','Border','Util']))
    (fixture/'Process.qml').write_text('''import QtQuick
QtObject {
 property bool running:false;property var command:[];property var environment:({});property bool stdinEnabled:false;property QtObject stdout
 signal started();signal exited(int code,int exitStatus)
 function write(data){} function signal(n){}
}''')
    (fixture/'StdioCollector.qml').write_text('import QtQuick\nQtObject {property bool waitForEnd:false;property string text:"";signal streamFinished()}')
    env={**os.environ,'HOME':directory,'XDG_DATA_HOME':directory+'/data','XDG_CACHE_HOME':directory+'/cache'}
    def cli(**payload):
        return json.loads(subprocess.run(['node',str(repo/'dist/renderer.mjs')],input=json.dumps(payload)+'\n',text=True,capture_output=True,check=True,env=env,timeout=35).stdout)
    def invoke(panel,name,*values):
        assert QMetaObject.invokeMethod(panel,name,*[Q_ARG('QVariant',v) for v in values]),name
        QTest.qWait(30)
    def value(panel,name):
        v=panel.property(name);return v.toVariant() if hasattr(v,'toVariant') else v
    def walk(item):
        yield item
        if hasattr(item,'childItems'):
            for child in item.childItems():yield from walk(child)
    def click(window,text):
        candidates=[o for o in walk(window.contentItem()) if isinstance(o,QObject) and o.property('text')==text and o.isVisible() and o.isEnabled() and o.metaObject().indexOfSignal('clicked()')>=0]
        assert candidates, 'Missing control '+text
        o=candidates[0];QTest.mouseClick(window,Qt.LeftButton,Qt.NoModifier,o.mapToScene(QPointF(o.width()/2,o.height()/2)).toPoint());QTest.qWait(60)
    def click_named(panel,window,name):
        o=panel.findChild(QObject,name);assert o is not None
        pos=o.mapToScene(QPointF(o.width()/2,o.height()/2)).toPoint()
        QTest.mouseClick(window,Qt.LeftButton,Qt.NoModifier,pos);QTest.qWait(60)
    def capture(window,name):
        QTest.qWait(120);assert window.grabWindow().save(str(out/(name+'.png')))
    engine=QQmlEngine();components=[];windows=[]
    def load(name):
        component=QQmlComponent(engine,QUrl.fromLocalFile(str(fixture/(name+'.qml'))));components.append(component)
        panel=component.create();assert panel is not None,[e.toString() for e in component.errors()];panel.setProperty('automaticPreview',False)
        window=panel.findChildren(QQuickWindow)[0];window.setParent(None);window.setWidth(1280);window.setHeight(850);panel.setProperty('opened',True);window.show();window.requestActivate();windows.append(window)
        return panel,window
    panel,window=load('Designer')
    result=cli(action='designNew',preset='blank');invoke(panel,'setDoc',result['document']);panel.setProperty('assetBaseUrl',result['assetBaseUrl'])
    capture(window,'01-start')
    invoke(panel,'edit','title','Studio notes');invoke(panel,'setLayout',True);invoke(panel,'addBlock','heading');invoke(panel,'blockEdit','text','A better way to work')
    invoke(panel,'commitFrame',0,48,56,490,65)
    invoke(panel,'addBlock','text');invoke(panel,'blockEdit','text','Studio notes / September 2026\n\nA practical guide to creating local documents. Add content, arrange the page and export a PDF you can share.')
    invoke(panel,'commitFrame',1,48,145,470,180)
    capture(window,'02-design')
    invoke(panel,'addBlock','table');invoke(panel,'commitFrame',2,48,345,480,180)
    panel.setProperty('selectedIndex',0);panel.setProperty('selectedIndex',2);QTest.qWait(80);capture(window,'03-table')
    click(window,'Page setup');capture(window,'04-page')
    panel.setProperty('pageSettings',False)
    saved=cli(action='designSave',document=value(panel,'doc'))['document'];invoke(panel,'setDoc',saved)
    panel.setProperty('libraryVisible',True);entries=cli(action='designList');panel.setProperty('entries',entries['entries']);panel.setProperty('entryTotal',entries['total']);capture(window,'05-saved')
    loaded=cli(action='designLoad',id=saved['id']);assert loaded['document']==saved
    panel.setProperty('libraryVisible',False)
    def render(action):
        invoke(panel,'request',action,{'page':1})
        result=cli(action=action,document=value(panel,'doc'),page=1)
        worker=panel.findChild(QObject,'pdfWorker');worker.setProperty('running',False)
        invoke(panel,'receiveOutput',json.dumps(result));invoke(panel,'receiveExit',0,0);QTest.qWait(250)
    render('designExport');capture(window,'06-export')
    window.setWidth(900);window.setHeight(650);panel.setProperty('layersVisible',True);capture(window,'07-small-window')
    window.setWidth(1280);window.setHeight(850);panel.setProperty('layersVisible',False)
    panel.setProperty('previewUrl',QUrl.fromLocalFile(directory+'/missing.png').toString());QTest.qWait(100);capture(window,'08-error')
    panel.setProperty('dirty',True);invoke(panel,'transition','close',{});capture(window,'09-unsaved');click(window,'Cancel');assert value(panel,'dirty')
    window.hide()
    invoice,iw=load('InvoicePanel');iw.setWidth(1040)
    draft=dict(id='00000000-0000-4000-8000-000000000000',revision=0,number='',date='2026-09-30',due='2026-10-30',company='Ballard Studio',companyAddress='Cheltenham\nUnited Kingdom',customer='Example Company',customerAddress='London\nUnited Kingdom',currency='GBP',taxRate='20',payment='Bank transfer within 30 days',notes='Thank you for your business.',items=[dict(description='Design and implementation',quantity='2',price='450.00')])
    invoke(invoice,'setDoc',draft);capture(iw,'10-invoice')
    iw.setWidth(900);iw.setHeight(650);capture(iw,'11-invoice-small')
    # Save the real invoice, then render through its production response handlers.
    saved_invoice=cli(action='save',draft=draft)['draft'];invoke(invoice,'setDoc',saved_invoice)
    iw.setWidth(1040);iw.setHeight(850)
    for action in ['preview','export']:
        invoke(invoice,'request',action,0)
        response=cli(action=action,draft=saved_invoice,page=1)
        invoice.findChild(QObject,'invoiceWorker').setProperty('running',False)
        invoke(invoice,'receiveOutput',json.dumps(response));invoke(invoice,'receiveExit',0,0)
        QTest.qWait(200)
        image=next(o for o in walk(iw.contentItem()) if o.objectName()=='pdfImage')
        assert image.isVisible() and image.property('progress')==1 and image.height()>250
    capture(iw,'12-invoice-pdf')
    iw.hide();window.show();window.requestActivate();panel.setProperty('previewError','');panel.setProperty('showPdf',False)
    invoke(panel,'setDoc',cli(action='designNew',preset='blank')['document'])
    invoke(panel,'addBlock','image')
    imported=cli(action='designImport',path=str(repo/'preview.png'))
    invoke(panel,'blockEdit','asset',imported['asset']);invoke(panel,'commitFrame',value(panel,'selectedIndex'),48,48,280,380)
    capture(window,'13-image')
    click(window,'File');capture(window,'14-file-menu');QTest.keyClick(window,Qt.Key_Escape)
    invoke(panel,'setDoc',cli(action='designNew',preset='blank')['document'])
    invoke(panel,'addBlock','heading');invoke(panel,'blockEdit','text','Design on the page')
    canvas=panel.findChild(QObject,'freeCanvas')
    invoke(canvas,'beginEditing',0,'text');capture(window,'15-inline-text');invoke(canvas,'finishEditing',False)
    invoke(panel,'chooseColour','block');QTest.qWait(120)
    dialog=panel.findChild(QObject,'colourPicker')
    capture(window,'16-colour-picker')
    QMetaObject.invokeMethod(dialog,'reject');QTest.qWait(60)
    assert not dialog.property('visible')
    old_colour=value(panel,'doc')['blocks'][0]['color']
    invoke(panel,'chooseColour','block');invoke(dialog,'setColour','#286ea8')
    click_named(panel,window,'applyColour')
    assert value(panel,'doc')['blocks'][0]['color']=='#286ea8'
    invoke(panel,'history',False)
    assert value(panel,'doc')['blocks'][0]['color']==old_colour
    window.requestActivate()
    invoke(panel,'addBlock','table');invoke(panel,'commitFrame',1,48,180,480,180);click_named(panel,window,'pasteCellsButton')
    panel.findChild(QObject,'tablePaste').setProperty('text','Service\tHours\tRate\nDesign\t8\t75\nDevelopment\t12\t90')
    capture(window,'17-paste-cells');click_named(panel,window,'applyCells');capture(window,'18-table-pasted')
    panel.setProperty('automaticPreview',True);QTest.qWait(900)
    assert value(panel,'backgroundPreview') and not value(panel,'editingBusy')
    response=cli(action='designPreview',document=value(panel,'doc'),page=1)
    panel.findChild(QObject,'pdfWorker').setProperty('running',False)
    invoke(panel,'receiveOutput',json.dumps(response));invoke(panel,'receiveExit',0,0)
    assert not value(panel,'showPdf') and not value(panel,'previewStale')
    panel.setProperty('showPdf',True);capture(window,'19-live-preview')
    for w in windows:w.close()
print('Captured UX flow in',out)
