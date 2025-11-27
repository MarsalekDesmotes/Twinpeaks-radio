uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

// --- NOISE FUNCTIONS ---
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; i++) {
        v += a * noise(st);
        st = rot * st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// --- PATTERNS ---
float zigzag(vec2 uv) {
    vec2 grid = uv * 10.0;
    float f = abs(fract(grid.x + (floor(grid.y) * 0.5)) - 0.5);
    // Actually, let's do a proper chevron
    // Chevron: abs(fract(x) - 0.5) < 0.25 ?
    // Let's try a simpler approach for the floor
    float pattern = abs(fract(uv.x * 5.0 + uv.y * 5.0) - 0.5);
    float pattern2 = abs(fract(uv.x * 5.0 - uv.y * 5.0) - 0.5);
    return step(0.25, pattern * pattern2); // Glitchy intersection
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 originalUV = uv;
    
    // --- DISTORTION (VHS) ---
    float wave = sin(uv.y * 20.0 + uTime * 2.0) * 0.002;
    float jitter = random(vec2(uTime, uv.y)) * 0.005 * step(0.98, random(vec2(uTime * 10.0, 0.0)));
    uv.x += wave + jitter;
    
    // --- SCENE ---
    vec3 color = vec3(0.0);
    
    // 1. Red Room Curtains (Background)
    float curtainWave = sin(uv.x * 15.0 + sin(uv.y * 5.0 + uTime * 0.5) * 1.0);
    float curtainShadow = smoothstep(-1.0, 1.0, curtainWave);
    vec3 redCurtain = mix(vec3(0.3, 0.0, 0.0), vec3(0.8, 0.05, 0.05), curtainShadow);
    
    // Add some fabric texture
    redCurtain *= 0.8 + 0.2 * fbm(uv * 50.0);
    
    // 2. Floor (Zig Zag) - Perspective projection
    // Simple pseudo-3D plane
    float horizon = 0.4;
    if (uv.y < horizon) {
        // Floor logic
        vec2 p = uv * 2.0 - 1.0;
        p.y += 0.5; // Shift horizon
        
        // Perspective divide
        vec2 floorUV = vec2(p.x / abs(p.y), 1.0 / abs(p.y));
        floorUV.y += uTime * 0.5; // Move floor
        
        // Zigzag pattern
        float zz = abs(fract(floorUV.x * 2.0 + floorUV.y * 2.0) - 0.5);
        float zz2 = abs(fract(floorUV.x * 2.0 - floorUV.y * 2.0) - 0.5);
        float chevron = step(0.25, (zz + zz2) * 0.5); // Approximation
        
        // Better Chevron
        float k = sign(fract(floorUV.y * 2.0) - 0.5);
        float stripe = step(0.5, fract(floorUV.x * 4.0 + floorUV.y * 4.0 * k));
        
        vec3 floorColor = mix(vec3(0.05), vec3(0.9), stripe);
        
        // Fog/Fade to back
        float dist = smoothstep(0.0, 1.0, abs(p.y));
        color = mix(redCurtain, floorColor, dist); // Fade floor into curtain color at horizon
    } else {
        color = redCurtain;
    }
    
    // 3. Shadowy Figure / Fog
    float fog = fbm(uv * 3.0 + uTime * 0.2);
    color = mix(color, vec3(0.0), fog * 0.6); // Dark fog
    
    // --- POST PROCESSING ---
    
    // Vignette
    float vig = 1.0 - length(originalUV - 0.5) * 1.5;
    color *= smoothstep(0.0, 1.0, vig);
    
    // Scanlines
    float scanline = sin(uv.y * 800.0) * 0.05;
    color -= scanline;
    
    // Grain
    float grain = random(uv + uTime) * 0.15;
    color += grain;
    
    // Color Grading (Twin Peaks Warmth + Noir)
    color = pow(color, vec3(1.2)); // Contrast
    color *= vec3(1.1, 0.9, 0.9); // Slight sepia/red tint
    
    gl_FragColor = vec4(color, 1.0);
}
