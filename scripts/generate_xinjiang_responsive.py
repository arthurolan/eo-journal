#!/Users/oneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3

from __future__ import annotations

from datetime import datetime
from html import escape
from pathlib import Path
import re

from PIL import Image, ImageCms
from PIL.ExifTags import Base, IFD


WORKSPACE = Path(__file__).resolve().parents[1]
SOURCE_DIR = WORKSPACE / "assets/images/photography/行摄新疆"
OUTPUT_DIR = SOURCE_DIR / "webp"
TARGET_WIDTHS = [640, 960, 1600, 2400]
SRGB_PROFILE = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()

CAPTIONS = [
    ("R3_01340-ms-j169-4ks.jpg", "吐鲁番，托克逊县"),
    ("7RR08498-m3-new-b4ks.jpg", "水上胡杨林"),
    ("7RR08720-jxms-x-m-2160s.jpg", "喀什古城，老铁匠"),
    ("7RR08779jm-new2021-j169-4ks.jpg", "喀什古城"),
    ("7RR09131-xm-2160ms.jpg", "轮台县，塔里木胡杨林"),
    ("K7_P0886b-xm-denoi-2160-m.jpg", "巴音布鲁克草原"),
    ("R3_01264-m-b4ks.jpg", "吐鲁番"),
    ("R3_01320-new-xs-j4ks.jpg", "吐鲁番，托克逊县"),
    ("R3_01356acr-new-s-b4k.jpg", "轮台县，塔里木胡杨林"),
    ("R3_01438acr-new-s-b4ks-gps.jpg", "轮台县，塔里木胡杨林"),
    ("R3_02301-j-2160s.jpg", "喀什，牛羊大巴扎"),
    ("R3_02972-m_1-m-filtr7-1-mxxx-m-2160s-gps.jpg", "塔什库尔干塔吉克自治县，塔合曼湿地"),
    ("R3_03115_1-new2021-j169s-j4ks-gps.jpg", "红其拉甫，冰河"),
    ("R3_03193-x-x-xms-m-m-j4ks-gps.jpg", "塔什库尔干塔吉克自治县，古石头城"),
    ("R3_03233Darky-Package-Cityscapes-m-cf-2160-gps.jpg", "塔什库尔干塔吉克自治县，古石头城"),
    ("R3_03339_PSMS-j169-m-4ks-gps.jpg", "塔什库尔干塔吉克自治县，古石头城"),
    ("R3_03362-new2021-xs-j4k-color-s-gps.jpg", "慕士塔格峰"),
    ("R3_03376-new-m-s-m-b4k-gps.jpg", "喀拉库勒湖"),
    ("R3_03410_PSMS-x-mm-ms-4ks-gps.jpg", "喀拉库勒湖"),
    ("R3_03487-m2025-jjj-2160-gps.jpg", "G314公路"),
    ("R3_03611-5-j1'1x-deno-shar-gi-m-2160.jpg", "温宿大峡谷"),
    ("R3_03689-xm-bxm-2160-gps.jpg", "库车大峡谷"),
    ("R3_03703-new-j-4ks.jpg", "尉犁县，罗布人村寨"),
    ("R3_03906-2022-j16'10-deno-sha-gi-sha-x-2160s-gps.jpg", "尉犁县，罗布人村寨"),
    ("R3_04387-2022-sky-m-deno-mxj-j1610-2160s-o-gps.jpg", "吐鲁番，托克逊县"),
    ("R3_0361619mm-Film-19Tones-Rooftop-1-bj169-4ks.jpg", "温宿大峡谷"),
]

EXIF_DATE_TAGS = (36867, 36868)
EXIF_FLOAT_TAGS = (33434, 33437, 37386)
EXIF_INT_TAGS = (34855, 41989)
EXIF_COPY_TAGS = (
    33434,  # ExposureTime
    33437,  # FNumber
    34855,  # ISOSpeedRatings
    36867,  # DateTimeOriginal
    36868,  # DateTimeDigitized
    37386,  # FocalLength
    41989,  # FocalLengthIn35mmFilm
    42034,  # LensSpecification
    42036,  # LensModel
)


def normalize_exif_time(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    candidates = (
        "%Y:%m:%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y:%m:%d %H:%M",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M",
    )
    for fmt in candidates:
        try:
            parsed = datetime.strptime(text[:19], fmt)
            return parsed.strftime("%Y:%m:%d %H:%M:00")
        except ValueError:
            continue
    match = re.match(r"^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2})", text)
    if match:
        return f"{match.group(1)}:{match.group(2)}:{match.group(3)} {match.group(4)}:{match.group(5)}:00"
    return None


def normalize_xmp_time(value: str | None) -> str | None:
    exif_time = normalize_exif_time(value)
    if not exif_time:
        return None
    parsed = datetime.strptime(exif_time, "%Y:%m:%d %H:%M:%S")
    return parsed.strftime("%Y-%m-%dT%H:%M:%S")


def find_xmp_attr(xmp_text: str, attr_name: str) -> str | None:
    match = re.search(rf"{re.escape(attr_name)}=\"([^\"]+)\"", xmp_text)
    return match.group(1) if match else None


def find_xmp_alt(xmp_text: str, tag_name: str) -> str | None:
    match = re.search(
        rf"<{tag_name}>\s*<rdf:Alt>\s*<rdf:li[^>]*>(.*?)</rdf:li>",
        xmp_text,
        re.S,
    )
    return match.group(1).strip() if match else None


def find_xmp_seq(xmp_text: str, tag_name: str) -> str | None:
    match = re.search(
        rf"<{tag_name}>\s*<rdf:Seq>\s*<rdf:li>(.*?)</rdf:li>",
        xmp_text,
        re.S,
    )
    return match.group(1).strip() if match else None


def make_output_exif(source: Image.Image, caption: str) -> tuple[bytes, bytes]:
    source_exif = source.getexif()
    source_exif_ifd = source_exif.get_ifd(IFD.Exif)
    xmp_bytes = source.info.get("xmp", b"")
    xmp_text = xmp_bytes.decode("utf-8", "ignore") if isinstance(xmp_bytes, (bytes, bytearray)) else ""

    artist = source_exif.get(Base.Artist) or find_xmp_seq(xmp_text, "dc:creator")
    copyright_text = source_exif.get(Base.Copyright) or find_xmp_alt(xmp_text, "dc:rights")
    capture_raw = None
    for tag in EXIF_DATE_TAGS:
        if source_exif_ifd.get(tag):
            capture_raw = source_exif_ifd.get(tag)
            break
    capture_raw = (
        capture_raw
        or find_xmp_attr(xmp_text, "photoshop:DateCreated")
        or find_xmp_attr(xmp_text, "xmp:CreateDate")
        or source_exif.get(Base.DateTime)
    )
    capture_exif = normalize_exif_time(capture_raw)
    capture_xmp = normalize_xmp_time(capture_raw)
    lens_model = source_exif_ifd.get(42036) or find_xmp_attr(xmp_text, "aux:Lens")

    output_exif = Image.Exif()
    if source_exif.get(Base.Make):
        output_exif[Base.Make] = source_exif.get(Base.Make)
    if source_exif.get(Base.Model):
        output_exif[Base.Model] = source_exif.get(Base.Model)
    if artist:
        output_exif[Base.Artist] = artist
    if copyright_text:
        output_exif[Base.Copyright] = copyright_text
    if capture_exif:
        output_exif[Base.DateTime] = capture_exif

    output_exif_ifd = output_exif.get_ifd(IFD.Exif)
    for tag in EXIF_COPY_TAGS:
        value = source_exif_ifd.get(tag)
        if value is not None:
            output_exif_ifd[tag] = value
    if capture_exif:
        output_exif_ifd[36867] = capture_exif
        output_exif_ifd[36868] = capture_exif
    if lens_model:
        output_exif_ifd[42036] = lens_model

    description_xml = (
        f"<dc:description><rdf:Alt><rdf:li xml:lang=\"x-default\">{escape(caption)}</rdf:li>"
        f"</rdf:Alt></dc:description>"
    )
    creator_xml = (
        f"<dc:creator><rdf:Seq><rdf:li>{escape(str(artist))}</rdf:li></rdf:Seq></dc:creator>"
        if artist
        else ""
    )
    rights_xml = (
        f"<dc:rights><rdf:Alt><rdf:li xml:lang=\"x-default\">{escape(str(copyright_text))}</rdf:li>"
        f"</rdf:Alt></dc:rights>"
        if copyright_text
        else ""
    )
    attrs = []
    if capture_xmp:
        attrs.append(f'xmp:CreateDate="{capture_xmp}"')
        attrs.append(f'photoshop:DateCreated="{capture_xmp}"')
    if lens_model:
        attrs.append(f'aux:Lens="{escape(str(lens_model))}"')
    attr_text = (" " + " ".join(attrs)) if attrs else ""
    output_xmp = (
        "<?xpacket begin=\"\ufeff\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>"
        "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">"
        "<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">"
        "<rdf:Description rdf:about=\"\" "
        "xmlns:dc=\"http://purl.org/dc/elements/1.1/\" "
        "xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" "
        "xmlns:photoshop=\"http://ns.adobe.com/photoshop/1.0/\" "
        "xmlns:aux=\"http://ns.adobe.com/exif/1.0/aux/\""
        f"{attr_text}>"
        f"{description_xml}{creator_xml}{rights_xml}"
        "</rdf:Description></rdf:RDF></x:xmpmeta>"
        "<?xpacket end=\"w\"?>"
    ).encode("utf-8")

    return output_exif.tobytes(), output_xmp


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for index, (filename, caption) in enumerate(CAPTIONS, start=1):
        source_path = SOURCE_DIR / filename
        image_id = f"xj-{index:02d}"

        with Image.open(source_path) as source:
            source.load()
            widths = [width for width in TARGET_WIDTHS if width <= source.width]
            if source.width not in widths:
                widths.append(source.width)
            exif_bytes, xmp_bytes = make_output_exif(source, caption)

            for width in widths:
                output_path = OUTPUT_DIR / f"{image_id}-w{width}.webp"
                height = round(source.height * width / source.width)
                resized = source.resize((width, height), Image.Resampling.LANCZOS)
                resized.save(
                    output_path,
                    format="WEBP",
                    quality=88,
                    method=6,
                    exif=exif_bytes,
                    xmp=xmp_bytes,
                    icc_profile=SRGB_PROFILE,
                )

        print(f"{image_id} {filename} -> {len(widths)} variants")


if __name__ == "__main__":
    main()
