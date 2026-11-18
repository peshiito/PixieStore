"""Add entrance animations, autoplay+loop for videos and fade transitions to a pptxgenjs deck."""
import re, sys, zipfile, shutil

src, dst = sys.argv[1], sys.argv[2]
STEP_MS = 220
VIDEO_MS = 16000

zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED)


class Ids:
    def __init__(self):
        self.n = 2

    def next(self):
        self.n += 1
        return self.n


def fade(ids, spid, delay):
    return (
        f'<p:par><p:cTn id="{ids.next()}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" nodeType="withEffect">'
        f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>'
        f'<p:set><p:cBhvr><p:cTn id="{ids.next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
        f'<p:to><p:strVal val="visible"/></p:to></p:set>'
        f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{ids.next()}" dur="600"/>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
        f'<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="{ids.next()}" dur="600" fill="hold"/>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr>'
        f'<p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_y+0.04"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav></p:tavLst></p:anim>'
        f'</p:childTnLst></p:cTn></p:par>'
    )


def play(ids, spid):
    return (
        f'<p:par><p:cTn id="{ids.next()}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="withEffect">'
        f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
        f'<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="{ids.next()}" dur="{VIDEO_MS}" fill="hold"/>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par>'
    )


def media_node(ids, spid):
    return (
        f'<p:video><p:cMediaNode vol="80000" mute="1"><p:cTn id="{ids.next()}" repeatCount="indefinite" fill="hold" display="0">'
        f'<p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cMediaNode></p:video>'
    )


def process(xml):
    shapes = re.findall(r'<p:cNvPr id="(\d+)" name="([^"]*)"', xml)
    groups = {}
    videos = []
    for sid, name in shapes:
        m = re.match(r"a_(\d+)$", name)
        if m:
            groups.setdefault(int(m.group(1)), []).append(sid)
        elif name.startswith("v_"):
            videos.append(sid)
    if not groups and not videos:
        return xml
    ids = Ids()
    inner = "".join(play(ids, v) for v in videos)
    for k, n in enumerate(sorted(groups)):
        for sid in groups[n]:
            inner += fade(ids, sid, 150 + k * STEP_MS)
    click = (
        f'<p:par><p:cTn id="{ids.next()}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/>'
        f'<p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
        f'<p:par><p:cTn id="{ids.next()}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
        f"{inner}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>"
    )
    medias = "".join(media_node(ids, v) for v in videos)
    timing = (
        '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
        '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
        f"{click}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt=\"onPrev\" delay=\"0\"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>"
        '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
        f"{medias}</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>"
    )
    xml = re.sub(r"<p:transition.*?</p:transition>|<p:transition[^>]*/>", "", xml, flags=re.S)
    xml = re.sub(r"<p:timing>.*?</p:timing>", "", xml, flags=re.S)
    trans = '<p:transition spd="med"><p:fade/></p:transition>'
    xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + trans + timing, 1)
    if trans not in xml:
        xml = xml.replace("</p:cSld>", "</p:cSld>" + trans + timing, 1)
    return xml


for item in zin.infolist():
    if item.filename.endswith('/'):
        continue
    data = zin.read(item.filename)
    if re.match(r"ppt/slides/slide\d+\.xml$", item.filename):
        data = process(data.decode("utf-8")).encode("utf-8")
    zout.writestr(item, data)
zout.close()
print("animated ->", dst)
