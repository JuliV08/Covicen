// Parallax 2.5D con mapa de profundidad (WebGL 2, cae a WebGL 1). Solo desktop con hover y sin reduced-motion; si algo falla, queda la foto.
// El canvas arranca con EXACTAMENTE el encuadre de la foto (cover, zoom 1): así el fundido de uno a otro es invisible.
const VS = 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*0.5+0.5,0.5-p.y*0.5);gl_Position=vec4(p,0.,1.);}';
// highp: con mediump (16 bits en muchas GPUs de Windows vía ANGLE) las UV se cuantizan y la foto se ve pixelada.
const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;uniform sampler2D img;uniform sampler2D dep;uniform vec2 esc;uniform vec2 vp;uniform vec2 desp;uniform float zoom;
void main(){vec2 uv=(v-0.5)*esc+0.5;uv=(uv-vp)/zoom+vp;float d=texture2D(dep,uv).r;gl_FragColor=texture2D(img,uv+desp*d);}`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const montar = (raiz: HTMLElement) => {
  const img = raiz.querySelector<HTMLImageElement>('img');
  const canvas = raiz.querySelector<HTMLCanvasElement>('canvas');
  const urlDep = raiz.dataset.profundidad;
  if (!img || !canvas || !urlDep) return;
  const opciones = { antialias: false, alpha: false, powerPreference: 'low-power' as const };
  const gl = (canvas.getContext('webgl2', opciones) ?? canvas.getContext('webgl', opciones)) as WebGLRenderingContext | null;
  if (!gl) return;
  const es2 = gl instanceof WebGL2RenderingContext;
  // Desde ya: la foto no anima (el canvas va a tomar el control con el mismo encuadre).
  raiz.classList.add('webgl');
  const [vpx, vpy] = (raiz.dataset.vp ?? '0.78,0.595').split(',').map(Number);

  const shader = (tipo: number, src: string) => {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const textura = (unidad: number, fuente: TexImageSource) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unidad);
    gl.bindTexture(gl.TEXTURE_2D, t);
    // WebGL2 admite espejar texturas de cualquier tamaño: el desplazamiento en los bordes no muestra nada raro.
    const envoltura = es2 ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, envoltura);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, envoltura);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, es2 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, fuente);
    if (es2) gl.generateMipmap(gl.TEXTURE_2D);
  };

  // `foto` es la imagen a resolución completa (data-textura), no el candidato responsive que eligió el <img>.
  const iniciar = (foto: HTMLImageElement, dep: HTMLImageElement) => {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const p = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    textura(0, foto);
    textura(1, dep);
    gl.uniform1i(gl.getUniformLocation(prog, 'img'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'dep'), 1);
    gl.uniform2f(gl.getUniformLocation(prog, 'vp'), vpx!, vpy!);
    const uEsc = gl.getUniformLocation(prog, 'esc');
    const uDesp = gl.getUniformLocation(prog, 'desp');
    const uZoom = gl.getUniformLocation(prog, 'zoom');
    const aspectoImg = foto.naturalWidth / foto.naturalHeight;

    const redimensionar = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const aspectoCv = canvas.width / canvas.height;
      // cover exacto, igual que object-fit: cover de la foto de abajo
      const esc = aspectoCv > aspectoImg ? [1, aspectoImg / aspectoCv] : [aspectoCv / aspectoImg, 1];
      gl.uniform2f(uEsc, esc[0]!, esc[1]!);
    };
    redimensionar();
    addEventListener('resize', redimensionar, { passive: true });

    // objetivo (mouse + scroll + deriva) → actual (suavizado)
    let mx = 0, my = 0, sy = 0, ax = 0, ay = 0, visible = true, animando = false;
    raiz.closest('section')?.addEventListener('pointermove', (e) => {
      const r = raiz.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });
    addEventListener('scroll', () => { sy = Math.min(1, scrollY / Math.max(1, raiz.clientHeight)); }, { passive: true });

    const cuadro = (t: number) => {
      animando = true;
      if (!visible) { animando = false; return; }
      const deriva = Math.sin(t / 9000) * 0.012;
      ax = lerp(ax, mx * 0.03 + deriva, 0.04);
      ay = lerp(ay, my * 0.02 + sy * 0.03 + Math.sin(t / 7000) * 0.005, 0.04);
      const zoom = 1 + (1 - Math.cos(t / 13000)) * 0.05; // dolly lento 1.00 → 1.10, arranca igual que la foto
      gl.uniform2f(uDesp, ax, ay);
      gl.uniform1f(uZoom, zoom);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(cuadro);
    };
    new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting; if (visible && !animando) requestAnimationFrame(cuadro); }).observe(raiz);
    // Primer cuadro dibujado ANTES de mostrar el canvas: nunca se ve vacío.
    gl.uniform2f(uDesp, 0, 0);
    gl.uniform1f(uZoom, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raiz.classList.add('activo');
    requestAnimationFrame(cuadro);
  };

  // Se cargan la foto a resolución completa y el mapa; cuando están las dos, arranca.
  const foto = new Image();
  const dep = new Image();
  let pendientes = 2;
  const listo = () => {
    if (--pendientes > 0) return;
    try { iniciar(foto, dep); } catch { raiz.classList.remove('activo', 'webgl'); }
  };
  const fallo = () => raiz.classList.remove('activo', 'webgl');
  foto.onload = listo; dep.onload = listo;
  foto.onerror = fallo; dep.onerror = fallo;
  foto.src = raiz.dataset.textura || img.currentSrc || img.src;
  dep.src = urlDep;
};

const iniciarTodo = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (min-width: 64rem)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-parallax]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
};
document.addEventListener('astro:page-load', iniciarTodo);

export {};
