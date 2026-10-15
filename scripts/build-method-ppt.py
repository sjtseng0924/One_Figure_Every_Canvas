"""Build annotated SVG artwork and rich feedback from the four original PPTs.

python scripts/build-method-ppt.py --source-dir PATH_TO_PPTS
Requires Pillow; the website uses only the generated static assets.
"""
import argparse
import base64
import html
import json
import math
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
from PIL import Image

NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "m": "http://schemas.openxmlformats.org/officeDocument/2006/math"}
UNIT = 9525
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "static/images/method/ppt"
THEME = {"dk1":"000000","lt1":"FFFFFF","dk2":"44546A","lt2":"E7E6E6",
         "accent1":"4472C4","accent2":"ED7D31","accent3":"A5A5A5",
         "accent4":"FFC000","accent5":"5B9BD5","accent6":"70AD47",
         "tx1":"000000","bg1":"FFFFFF","tx2":"44546A","bg2":"E7E6E6"}

def local(e): return e.tag.rsplit("}",1)[-1]

def color(e, default="#000000"):
    if e is None: return default
    if e.find("a:noFill",NS) is not None: return "none"
    fill=e.find("a:solidFill",NS)
    if fill is None or len(fill)==0: return default
    clr=fill[0]; value=clr.get("val","000000")
    value=THEME.get(value,value) if local(clr)=="schemeClr" else clr.get("lastClr",value)
    rgb=[int(value[i:i+2],16) for i in (0,2,4)]
    for mod in clr:
        v=int(mod.get("val",0))/100000
        if local(mod) in ("lumMod","shade"): rgb=[x*v for x in rgb]
        elif local(mod)=="lumOff": rgb=[x+255*v for x in rgb]
        elif local(mod)=="tint": rgb=[x+(255-x)*v for x in rgb]
    return "#"+"".join(f"{max(0,min(255,round(v))):02x}" for v in rgb)

def rich_run(e):
    p=e.find("a:rPr",NS); text=html.escape("".join(t.text or "" for t in e.findall("a:t",NS)))
    if p is None: return text
    styles=[]
    if p.get("b")=="1": styles.append("font-weight:700")
    if p.get("i")=="1": styles.append("font-style:italic")
    if p.get("u") not in (None,"none"): styles.append("text-decoration:underline")
    if p.find("a:solidFill",NS) is not None: styles.append("color:"+color(p))
    return '<span style="'+";".join(styles)+'">'+text+'</span>' if styles else text

def math_html(e, inherited_color="#000000"):
    """The OMML constructs used in the supplied decks, preserved as MathML."""
    tag=local(e)
    if tag.endswith("Pr") or tag in ("ctrlPr","rPr"): return ""
    if tag=="t": return "<mi>"+html.escape(e.text or "")+"</mi>"
    if tag in ("sSub","sSup","sSubSup"):
        t={"sSub":"msub","sSup":"msup","sSubSup":"msubsup"}[tag]
        return f'<{t}>'+"".join(math_html(c,inherited_color) for c in e if not local(c).endswith("Pr"))+f'</{t}>'
    if tag=="acc":
        c=e.find("m:accPr/m:chr",NS); c=c.get("{"+NS["m"]+"}val","̂") if c is not None else "̂"
        return '<mover accent="true">'+math_html(e.find("m:e",NS),inherited_color)+'<mo>'+c+'</mo></mover>'
    if tag=="d": return '<mrow><mo>(</mo>'+'<mo>|</mo>'.join(math_html(c,inherited_color) for c in e if local(c)=="e")+'<mo>)</mo></mrow>'
    inner="".join(math_html(c,inherited_color) for c in e)
    if tag=="r": return '<mstyle mathcolor="'+color(e.find("a:rPr",NS),inherited_color)+'">'+inner+'</mstyle>'
    return '<mrow>'+inner+'</mrow>'

def text_html(shape):
    body=shape.find("p:txBody",NS)
    if body is None: return ""
    out=[]; in_list=False
    for p in body.findall("a:p",NS):
        prop=p.find("a:pPr",NS)
        level=int(prop.get("lvl",0)) if prop is not None else 0
        inherited_color=None
        for path in ("a:lstStyle/a:defPPr/a:defRPr",f"a:lstStyle/a:lvl{level+1}pPr/a:defRPr"):
            inherited_color=color(body.find(path,NS),inherited_color)
        if prop is not None: inherited_color=color(prop.find("a:defRPr",NS),inherited_color)
        color_style=f';color:{inherited_color}' if inherited_color else ''
        numbered=p.find("a:pPr/a:buAutoNum",NS) is not None
        if numbered and not in_list: out.append('<ol>'); in_list=True
        if not numbered and in_list: out.append('</ol>'); in_list=False
        pieces=[]
        for n in p:
            tag=local(n)
            if tag=="r": pieces.append(rich_run(n))
            elif tag=="br": pieces.append('<br/>')
            elif tag=="m": pieces.append('<math xmlns="http://www.w3.org/1998/Math/MathML">'+math_html(n,inherited_color or '#000000')+'</math>')
        inner="".join(pieces)
        if numbered: out.append(f'<li style="color:{inherited_color}">'+inner+'</li>' if inherited_color else '<li>'+inner+'</li>')
        else:
            prop=p.find("a:pPr",NS); align={"ctr":"center","r":"right"}.get(prop.get("algn") if prop is not None else "","left")
            out.append(f'<p style="text-align:{align}{color_style}">'+(inner or '<br/>')+'</p>')
    if in_list: out.append('</ol>')
    return "".join(out)

class Presentation:
    def __init__(self,path):
        self.archive=ZipFile(path)
        rels=ET.fromstring(self.archive.read('ppt/slides/_rels/slide1.xml.rels'))
        self.rels={r.get('Id'):r.get('Target') for r in rels}
        self.shapes={};self.order=[];self.feedback_shapes={}
        root=ET.fromstring(self.archive.read('ppt/slides/slide1.xml'))
        self.walk(root.find('p:cSld/p:spTree',NS),(1,1,0,0))

    def walk(self,parent,matrix):
        for shape in parent:
            tag=local(shape)
            if tag=='AlternateContent':
                choice=next((c for c in shape if local(c)=='Choice'),None)
                if choice is not None:
                    for s in choice.findall('p:sp',NS): self.feedback_shapes[s.find('p:nvSpPr/p:cNvPr',NS).get('id')]=s
                fallback=next((c for c in shape if local(c)=='Fallback'),None)
                self.walk(fallback if fallback is not None else choice,matrix)
            elif tag=='grpSp':
                xf=shape.find('p:grpSpPr/a:xfrm',NS)
                off,ext,co,ce=[xf.find('a:'+n,NS) for n in ('off','ext','chOff','chExt')]
                sx=int(ext.get('cx'))/max(1,int(ce.get('cx')));sy=int(ext.get('cy'))/max(1,int(ce.get('cy')))
                tx=(int(off.get('x'))-sx*int(co.get('x')))/UNIT;ty=(int(off.get('y'))-sy*int(co.get('y')))/UNIT
                a,d,e,f=matrix;self.walk(shape,(a*sx,d*sy,a*tx+e,d*ty+f))
            elif tag in ('pic','sp','cxnSp'):
                prop=shape.find('.//p:cNvPr',NS)
                if prop is not None:
                    key=prop.get('id');self.shapes[key]=(shape,matrix);self.order.append(key)

    def bounds(self,key):
        shape,(a,d,e,f)=self.shapes[str(key)];xf=shape.find('.//a:xfrm',NS)
        off,ext=xf.find('a:off',NS),xf.find('a:ext',NS)
        x,y,w,h=[int(n.get(k))/UNIT for n,k in [(off,'x'),(off,'y'),(ext,'cx'),(ext,'cy')]]
        angle=int(xf.get('rot',0))/60000*math.pi/180;cx,cy=x+w/2,y+h/2
        points=[(cx+math.cos(angle)*(px-cx)-math.sin(angle)*(py-cy),cy+math.sin(angle)*(px-cx)+math.cos(angle)*(py-cy)) for px,py in [(x,y),(x+w,y),(x,y+h),(x+w,y+h)]]
        xs,ys=[a*px+e for px,py in points],[d*py+f for px,py in points]
        return min(xs),min(ys),max(xs),max(ys)

    def artwork(self,ids,target,title):
        ids={str(i) for i in ids};assert ids<=self.shapes.keys(),ids-self.shapes.keys()
        boxes=[self.bounds(i) for i in ids]
        box=(min(b[0] for b in boxes)-5,min(b[1] for b in boxes)-5,max(b[2] for b in boxes)+5,max(b[3] for b in boxes)+5)
        svg=self.svg(''.join(self.render(i) for i in self.order if i in ids),box,title)
        (DEST/target).write_text(svg,encoding='utf-8')
        return {'src':'static/images/method/ppt/'+target,'ids':sorted(ids),'ratio':(box[2]-box[0])/(box[3]-box[1])}

    @staticmethod
    def svg(content,box,title):
        x,y,r,b=box
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {r-x} {b-y}" role="img"><title>{html.escape(title)}</title><defs><marker id="ppt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>{content}</svg>'

    def render(self,key):
        shape,matrix=self.shapes[str(key)];xf=shape.find('.//a:xfrm',NS)
        off,ext=xf.find('a:off',NS),xf.find('a:ext',NS)
        x,y,w,h=[int(n.get(k))/UNIT for n,k in [(off,'x'),(off,'y'),(ext,'cx'),(ext,'cy')]]
        prop=shape.find('p:spPr',NS);line=prop.find('a:ln',NS)
        stroke=color(line,'#000000' if line is not None else 'none')
        width=int(line.get('w',9525))/UNIT if line is not None else .75
        geo=prop.find('a:prstGeom',NS);geom=geo.get('prst','rect') if geo is not None else 'rect'
        angle=int(xf.get('rot',0))/60000
        transform=f'translate({x+w/2} {y+h/2}) rotate({angle}) scale({-1 if xf.get("flipH")=="1" else 1} {-1 if xf.get("flipV")=="1" else 1}) translate({-w/2} {-h/2})'
        dash=' stroke-dasharray="5 4"' if line is not None and line.find('a:prstDash',NS) is not None else ''
        blip=shape.find('.//a:blip',NS);content=''
        if local(shape)=='cxnSp':
            if 'bentConnector' in geom:
                adj=geo.find('a:avLst/a:gd',NS);fraction=float(adj.get('fmla','val 50000').split()[-1])/100000 if adj is not None else .5
                path=f'M0 0H{w*fraction}V{h}H{w}'
            else:path=f'M0 0L{w} {h}'
            marker=' marker-end="url(#ppt-arrow)"' if line is not None and line.find('a:tailEnd',NS) is not None else ''
            content+=f'<path d="{path}" fill="none" stroke="{stroke}" stroke-width="{width}"{dash}{marker}/>'
        else:
            if blip is not None:
                rid=blip.get('{'+NS['r']+'}embed');data=self.archive.read('ppt/'+self.rels[rid].replace('../',''))
                crop=shape.find('.//a:srcRect',NS)
                if crop is not None and crop.attrib:
                    im=Image.open(BytesIO(data));l,t,r,b=[int(crop.get(k,0))/100000 for k in ('l','t','r','b')]
                    im=im.crop((round(l*im.width),round(t*im.height),round((1-r)*im.width),round((1-b)*im.height)))
                    stream=BytesIO();im.save(stream,format='PNG');data=stream.getvalue()
                mime='image/jpeg' if data[:2]==b'\xff\xd8' else 'image/png'
                uri=f'data:{mime};base64,'+base64.b64encode(data).decode()
                fill_rect=shape.find('.//a:fillRect',NS)
                fl,ft,fr,fb=[int(fill_rect.get(k,0))/100000 if fill_rect is not None else 0 for k in ('l','t','r','b')]
                content+=f'<image x="{fl*w}" y="{ft*h}" width="{w*(1-fl-fr)}" height="{h*(1-ft-fb)}" preserveAspectRatio="none" href="{uri}"/>'
                fill='none'
            else:fill=color(prop,'none')
            radius=min(w,h)*.1667 if geom=='roundRect' else 0
            content+=f'<rect width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"{dash}/>'
            if blip is None and shape.find('p:txBody',NS) is not None:
                tx=shape.find('p:txBody',NS);rp=tx.find('.//a:rPr',NS);size=int(rp.get('sz',1800))/100*4/3 if rp is not None else 24
                bp=tx.find('a:bodyPr',NS);anchor='center' if bp is not None and bp.get('anchor')=='ctr' else 'flex-start'
                content+=f'<foreignObject width="{w}" height="{h}" style="overflow:visible"><div xmlns="http://www.w3.org/1999/xhtml" class="ppt-overview-text" style="box-sizing:border-box;width:100%;height:100%;display:flex;flex-direction:column;justify-content:{anchor};padding:3px 6px;font-family:Calibri,Arial,sans-serif;font-size:{size}px;line-height:1.12;color:#000"><style>.ppt-overview-text p{{margin:0}}.ppt-overview-text ol{{margin:0;padding-left:1.5em}}</style>{text_html(shape)}</div></foreignObject>'
        a,d,e,f=matrix
        return f'<g data-ppt-id="{key}" transform="matrix({a} 0 0 {d} {e} {f})"><g transform="{transform}">{content}</g></g>'

    def feedback(self,key):
        key=str(key);return text_html(self.feedback_shapes.get(key,self.shapes[key][0]))

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source-dir',type=Path,required=True)
    args=parser.parse_args();DEST.mkdir(parents=True,exist_ok=True);data={}
    definitions={
        'parse':('parse-stage.pptx',[13],[([17,4,5,6],[15,16,19],14,24),([9,7,8,10,34,35,36],[27,31,39,44,46,55],20,26),([11,33,38,45],[12,18,30,48,51,53],None,25)]),
        'style':('style-stage.pptx',[13,66,67,74,75,146],[([15,41,33,34,35,36,37,38],[],None,None),([17,84,86,87,92,149],[],55,50),([19,88,90,91,93,150],[],None,52)]),
        'layout':('layout-stage (1).pptx',[6],[([5,7,23,25],[9,21,45],35,62),([1050,1056,3,11,14],[1058,16,31,41],40,63),([1030,20,22,24,26],[28,33,36,42],None,60)])}
    for stage,(filename,original,iterations) in definitions.items():
        deck=Presentation(args.source_dir/filename)
        entry={'original':deck.artwork(original,f'{stage}-original.svg','Original Image'),'iterations':[]}
        included=set(str(i) for i in original)
        for index,(diagram,zooms,feedback,outcome) in enumerate(iterations):
            item={'diagram':deck.artwork(diagram,f'{stage}-{index+1}.svg',f'{stage} iteration {index+1} with all original annotations'),'feedback':deck.feedback(feedback) if feedback else ''}
            included.update(str(i) for i in diagram+zooms)
            if zooms:item['zooms']=deck.artwork(zooms,f'{stage}-{index+1}-zooms.svg','All magnified regions with original colored borders')
            if outcome:item['outcome']=deck.artwork([outcome],f'{stage}-{index+1}-outcome.svg','Accepted' if index==2 else 'Needs correction')
            entry['iterations'].append(item)
        annotations={k for k,(s,_) in deck.shapes.items() if s.find('p:spPr/a:ln/a:solidFill/a:srgbClr',NS) is not None}
        assert annotations<=included,f'{stage}: omitted annotation IDs {annotations-included}'
        entry['annotationCount']=len(annotations);data[stage]=entry
        print(f'{stage}: preserved all {len(annotations)} colored annotations and original feedback')
    deck=Presentation(args.source_dir/'overview.pptx')
    groups=[(0,[4,5,6,129]),(.35,[7,10,16,17,20,19,21,25,26,29,32,35,11,38,53]),(1.2,[8,57,58,59,60,73,77,78,81,84,88,100,101,102,99,112,138,153,132,162]),(2.05,[9,116,117,122,123,131,137,139,140,143,147,150,156]),(2.95,[124,125,126,159])]
    assigned={str(i) for at,ids in groups for i in ids};assert assigned==set(deck.shapes),f'Overview missing {set(deck.shapes)-assigned}'
    boxes=[deck.bounds(k) for k in deck.shapes];box=(min(b[0] for b in boxes)-12,min(b[1] for b in boxes)-12,max(b[2] for b in boxes)+12,max(b[3] for b in boxes)+12)
    layers=''.join(f'<g class="method-build" data-at="{at}">'+''.join(deck.render(k) for k in deck.order if k in {str(i) for i in ids})+'</g>' for at,ids in groups)
    data['overview']=deck.svg(layers,box,'Overview: Parse, Style, and Layout; complete connectors appear with their destination stage')
    (ROOT/'static/js/method-ppt.js').write_text('// Generated by scripts/build-method-ppt.py; source wording and annotation shapes are preserved.\nwindow.METHOD_PPT = '+json.dumps(data,ensure_ascii=False)+';\n',encoding='utf-8')

if __name__=='__main__':main()
