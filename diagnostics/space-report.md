# Space deployment report

## Space

- id: `DeepLearning-VT/DeepLearning_2026`
- private: `True`
- sdk: `static`
- last modified: `2026-08-17 06:40:25+00:00`
- runtime stage: `RUNNING`

## Files

total: **400**

| top-level entry | files |
| --- | --- |
| `.gitattributes` | 1 |
| `README.md` | 1 |
| `index.html` | 1 |
| `lecture-01` | 219 |
| `lecture-02` | 178 |

<details><summary>root-level files</summary>

- `.gitattributes`
- `README.md`
- `index.html`

</details>

### lecture-01

- files: **219**
- of which assets: **215**
- has index.html: **True**
- has slides.pdf: **True**

### lecture-02

- files: **178**
- of which assets: **174**
- has index.html: **True**
- has slides.pdf: **True**

## Deployed HTML

### `index.html`

- size: 5015 bytes
- script src: none
- stylesheet href: none
- deck links: `lecture-01/index.html`, `lecture-02/index.html`

- referenced assets missing from the repo: none

### `lecture-01/index.html`

- size: 3301 bytes
- script src: `./assets/index-y1O4_MBz.js`
- stylesheet href: `./assets/modules/shiki-BrmBd2_v.css`, `./assets/index-DH1m-Wua.css`
- deck links: none

- referenced assets missing from the repo: none

## Serving layer

- app index.html: `200` `text/html` 5131 bytes
    - `cross-origin-opener-policy`: `same-origin`
    - `access-control-allow-origin`: `*`
- deck index.html: `200` `text/html` 3406 bytes
    - `cross-origin-opener-policy`: `same-origin`
    - `access-control-allow-origin`: `*`
- deck entry bundle: `200` `application/javascript; charset=utf-8` 93087 bytes
    - `cross-origin-opener-policy`: `same-origin`
    - `access-control-allow-origin`: `*`
    - `etag`: `"1613da1498e67bbc7774ce9679012384bb961a8b"`

## How the Space page embeds the app

- Space page HTML: `HTTP 401` Unauthorized
- iframe tags found in server HTML: **0**
- page HTML mentions `sandbox=`: **False**
- page HTML mentions `static.hf.space`: **False**

