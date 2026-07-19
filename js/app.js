// ============================================================================
//  CFE 2020 — CALCULADORA DE PRESIÓN DE VIENTO
//  Manual C.1.4 Diseño por Viento
// ============================================================================

// Tabla 3.1 — Altitud vs Ω
const TABLA_OMEGA = [
    [0, 760], [500, 720], [1000, 675], [1500, 635],
    [2000, 600], [2500, 565], [3000, 530], [3500, 495]
];

// Tabla 2.2 — Parámetros por categoría
const PARAMETROS = {
    1: {c: 1.142, alpha: 0.061, delta: 280, desc: "Terreno abierto, costas, superficies de agua"},
    2: {c: 1.000, alpha: 0.095, delta: 350, desc: "Campo con pocas obstrucciones"},
    3: {c: 0.832, alpha: 0.140, delta: 410, desc: "Áreas urbanas, suburbanas y bosques"},
    4: {c: 0.668, alpha: 0.192, delta: 470, desc: "Centros urbanos y complejos industriales"}
};

const INFO_GRUPOS = {
    "A+": "Tr=200 años | Mapa Fig. 2.1 | VR ≥ 1.2×VR(200) — Estudio específico requerido",
    "A": "Tr=200 años | Mapa Fig. 2.1 | Opcional: Q=15 (Fig. 2.4)",
    "B": "Tr=50 años | Mapa Fig. 2.2 | Opcional: Q=5 (Fig. 2.5)",
    "C": "Tr=10 años | Mapa Fig. 2.3 | No aplica velocidad óptima"
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateGrupo();
    updateTopo();
    updateCategoria();
    updateReporte();
    registerSW();
});

// Registro del Service Worker
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('SW registrado'))
            .catch(err => console.log('SW error:', err));
    }
}

// Instalación PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBanner').classList.remove('hidden');
    
    document.getElementById('installBanner').addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            document.getElementById('installBanner').classList.add('hidden');
        });
    });
});

// ============================================================================
//  ACTUALIZACIONES DE INTERFAZ
// ============================================================================

function updateGrupo() {
    const grupo = document.getElementById('grupo').value;
    document.getElementById('infoGrupo').textContent = INFO_GRUPOS[grupo];
    updateReporte();
}

function updateTopo() {
    const topo = document.getElementById('topo').value;
    const manualGroup = document.getElementById('ftManualGroup');
    
    if (topo === 'expuesto') {
        manualGroup.classList.remove('hidden');
        document.getElementById('infoFT').textContent = 'FT = (ingrese valor manual)';
    } else if (topo === 'protegido') {
        manualGroup.classList.add('hidden');
        document.getElementById('infoFT').textContent = 'FT = 0.90';
    } else {
        manualGroup.classList.add('hidden');
        document.getElementById('infoFT').textContent = 'FT = 1.00';
    }
    updateReporte();
}

function updateCategoria() {
    const cat = parseInt(document.getElementById('categoria').value);
    const p = PARAMETROS[cat];
    document.getElementById('infoCat').textContent = 
        `c=${p.c.toFixed(3)} | α=${p.alpha.toFixed(3)} | δ=${p.delta} m — ${p.desc}`;
    updateReporte();
}

function getFT() {
    const topo = document.getElementById('topo').value;
    if (topo === 'protegido') return 0.90;
    if (topo === 'normal') return 1.00;
    return parseFloat(document.getElementById('ftManual').value) || 1.30;
}

function interpolarOmega(altitud) {
    if (altitud <= TABLA_OMEGA[0][0]) return TABLA_OMEGA[0][1];
    if (altitud >= TABLA_OMEGA[TABLA_OMEGA.length - 1][0]) {
        const last = TABLA_OMEGA[TABLA_OMEGA.length - 1];
        const prev = TABLA_OMEGA[TABLA_OMEGA.length - 2];
        return last[1] + (altitud - last[0]) * (last[1] - prev[1]) / (last[0] - prev[0]);
    }
    for (let i = 0; i < TABLA_OMEGA.length - 1; i++) {
        const [h1, w1] = TABLA_OMEGA[i];
        const [h2, w2] = TABLA_OMEGA[i + 1];
        if (h1 <= altitud && altitud <= h2) {
            return w1 + (altitud - h1) * (w2 - w1) / (h2 - h1);
        }
    }
    return TABLA_OMEGA[TABLA_OMEGA.length - 1][1];
}

// ============================================================================
//  CÁLCULO PRINCIPAL
// ============================================================================

function calcular() {
    try {
        // Paso 1
        const grupo = document.getElementById('grupo').value;
        
        // Paso 2 — FT
        const ft = getFT();
        document.getElementById('infoFT').textContent = `FT = ${ft.toFixed(4)}`;
        
        // Paso 3 — Frz
        const z = parseFloat(document.getElementById('alturaZ').value);
        if (z <= 0 || z > 200) {
            alert('La altura z debe estar entre 0 y 200 m.');
            return;
        }
        
        const cat = parseInt(document.getElementById('categoria').value);
        const p = PARAMETROS[cat];
        let frz;
        if (z <= 10.0) {
            frz = p.c;
        } else if (z < p.delta) {
            frz = p.c * Math.pow(z / 10.0, p.alpha);
        } else {
            frz = p.c * Math.pow(p.delta / 10.0, p.alpha);
        }
        document.getElementById('infoFrz').textContent = `Frz = ${frz.toFixed(4)}`;
        
        // Paso 4 — VD
        const vr = parseFloat(document.getElementById('vr').value);
        if (vr <= 0) {
            alert('VR debe ser mayor que 0 km/h.');
            return;
        }
        const vd = ft * frz * vr;
        document.getElementById('infoVD').textContent = 
            `VD = ${ft.toFixed(4)} × ${frz.toFixed(4)} × ${vr.toFixed(1)} = ${vd.toFixed(2)} km/h`;
        
        // Paso 5 — G
        const altitud = parseFloat(document.getElementById('altitud').value);
        const tau = parseFloat(document.getElementById('tau').value);
        if (tau < -50 || tau > 50) {
            alert('τ debe estar entre -50 °C y 50 °C.');
            return;
        }
        
        const omega = interpolarOmega(altitud);
        const G = 0.392 * omega / (273.0 + tau);
        
        document.getElementById('infoOmega').textContent = 
            `Ω = ${omega.toFixed(1)} mm Hg (Tabla 3.1, altitud=${altitud} msnm)`;
        document.getElementById('infoG').textContent = 
            `G = 0.392 × ${omega.toFixed(1)} / (273 + ${tau}) = ${G.toFixed(5)}`;
        
        // Paso 6 — qz
        const qzPa = 0.047 * G * Math.pow(vd, 2);
        const qzKg = 0.0048 * G * Math.pow(vd, 2);
        
        document.getElementById('qzPa').textContent = `qz = ${qzPa.toFixed(2)} Pa (N/m²)`;
        document.getElementById('qzKg').textContent = `qz = ${qzKg.toFixed(2)} kg/m² [Ec. 3.1.a]`;
        
        // Reporte
        updateReporteResultados(grupo, ft, z, cat, frz, vr, vd, omega, tau, G, qzPa, qzKg);
        
    } catch (e) {
        alert('Error en el cálculo: ' + e.message);
    }
}

// ============================================================================
//  REPORTE TÉCNICO
// ============================================================================

function updateReporte() {
    const grupo = document.getElementById('grupo').value;
    const topo = document.getElementById('topo').value;
    const cat = parseInt(document.getElementById('categoria').value);
    const p = PARAMETROS[cat];
    
    const reporte = `
${'═'.repeat(50)}
  REPORTE TÉCNICO — CFE 2020 · C.1.4 DISEÑO POR VIENTO
  Complete los datos y presione CALCULAR
${'═'.repeat(50)}

[PASO 1] GRUPO DE IMPORTANCIA
  ${grupo === 'A+' ? 'Grupo A+' : grupo === 'A' ? 'Grupo A' : grupo === 'B' ? 'Grupo B' : 'Grupo C'}
  Ref: Inciso 1.3, Tabla 1.1

[PASO 2] FACTOR DE TOPOGRAFÍA FT
  ${topo === 'protegido' ? 'Sitio protegido' : topo === 'normal' ? 'Sitio normal' : 'Sitio expuesto'}
  Ref: Inciso 2.4, Tabla 2.3

[PASO 3] FACTOR DE EXPOSICIÓN Frz
  Categoría ${cat}
  c=${p.c.toFixed(3)}, α=${p.alpha.toFixed(3)}, δ=${p.delta} m
  Ref: Inciso 2.3, Tablas 2.1-2.2, Ecs. 2.3-2.5

[PASO 4] VELOCIDAD BÁSICA DE DISEÑO VD
  VD = FT × Frz × VR
  Ref: Inciso 2, Ec. 2.1

[PASO 5] FACTOR DE CORRECCIÓN G
  G = 0.392 × Ω / (273 + τ)
  Ref: Inciso 3.2, Ec. 3.2, Tabla 3.1

[PASO 6] PRESIÓN DINÁMICA DE BASE qz
  qz = 0.047 × G × VD²  [Pa]
  qz = 0.0048 × G × VD² [kg/m²]
  Ref: Inciso 3.2, Ecs. 3.1 y 3.1.a

${'═'.repeat(50)}
  ${new Date().toLocaleString()}
${'═'.repeat(50)}`;
    
    document.getElementById('reporte').textContent = reporte;
}

function updateReporteResultados(grupo, ft, z, cat, frz, vr, vd, omega, tau, G, qzPa, qzKg) {
    const p = PARAMETROS[cat];
    
    const reporte = `
${'═'.repeat(55)}
  REPORTE TÉCNICO — RESULTADOS
  CFE 2020 · C.1.4 DISEÑO POR VIENTO
${'═'.repeat(55)}

[PASO 1] GRUPO DE IMPORTANCIA
  Grupo ${grupo}
  Ref: Inciso 1.3, Tabla 1.1

[PASO 2] FACTOR DE TOPOGRAFÍA FT
  FT = ${ft.toFixed(4)}
  Ref: Inciso 2.4, Tabla 2.3

[PASO 3] FACTOR DE EXPOSICIÓN Frz
  Categoría: ${cat} — ${p.desc}
  Parámetros: c=${p.c.toFixed(3)}, α=${p.alpha.toFixed(3)}, δ=${p.delta} m
  Altura: z = ${z} m
  Frz = ${frz.toFixed(4)}
  Ref: Inciso 2.3, Tablas 2.1-2.2, Ecs. 2.3-2.5

[PASO 4] VELOCIDAD BÁSICA DE DISEÑO VD
  VR = ${vr.toFixed(1)} km/h
  VD = FT × Frz × VR
  VD = ${ft.toFixed(4)} × ${frz.toFixed(4)} × ${vr.toFixed(1)}
  VD = ${vd.toFixed(2)} km/h
  Ref: Inciso 2, Ec. 2.1

[PASO 5] FACTOR DE CORRECCIÓN G
  Altitud: ${document.getElementById('altitud').value} msnm
  Ω = ${omega.toFixed(1)} mm Hg (Tabla 3.1)
  τ = ${tau} °C
  G = 0.392 × Ω / (273 + τ)
  G = 0.392 × ${omega.toFixed(1)} / (273 + ${tau})
  G = ${G.toFixed(5)}
  Ref: Inciso 3.2, Ec. 3.2, Tabla 3.1

[PASO 6] PRESIÓN DINÁMICA DE BASE qz
  qz = 0.047 × G × VD²
  qz = 0.047 × ${G.toFixed(5)} × (${vd.toFixed(2)})²
  qz = ${qzPa.toFixed(2)} Pa (N/m²)     ← Ec. 3.1
  qz = ${qzKg.toFixed(2)} kg/m²         ← Ec. 3.1.a
  
${'═'.repeat(55)}
  RESUMEN FINAL:
  VD = ${vd.toFixed(2)} km/h  |  G = ${G.toFixed(5)}
  qz = ${qzPa.toFixed(2)} Pa  |  qz = ${qzKg.toFixed(2)} kg/m²
${'═'.repeat(55)}
  ${new Date().toLocaleString()}
  Manual CFE 2020 — C.1.4 Diseño por Viento
${'═'.repeat(55)}`;
    
    document.getElementById('reporte').textContent = reporte;
}

function copiarReporte() {
    const reporte = document.getElementById('reporte').textContent;
    navigator.clipboard.writeText(reporte)
        .then(() => alert('📋 Reporte copiado al portapapeles'))
        .catch(() => alert('Error al copiar'));
}

function guardarReporte() {
    const reporte = document.getElementById('reporte').textContent;
    const blob = new Blob([reporte], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Viento_CFE2020_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}