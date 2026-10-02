/* =========================================================
   shader.js
   Archigram monochrome line shader
   =========================================================
   Contains:

   - SETTINGS: the main adjustable variable list
   - PRESETS: named preset overrides
   - VIEW: final merged settings
   - createArchigramMaterial()
   - createEdgeMaterial()
   ========================================================= */


/* =========================================================
   ADJUSTABLE VARIABLES
   =========================================================
   Edit these values and refresh.

   preset:
     "custom" — uses current SETTINGS
     "clean"  — thin architectural drawing
     "comic"  — stronger black/pattern
     "dense"  — dense cross-hatched technical drawing
   ========================================================= */

const SETTINGS = {
  preset: "custom",

  // Page/background color
  backgroundColor: "#f4f1e8",

  // Camera/viewport
  camera: {
    position: [9, 7, 10],
    target: [0, 0, 0],
    fieldOfView: 38,
    near: 0.1,
    far: 100
  },

  // Shader appearance
  shader: {
    inkColor: "#ff0000",
    paperColor: "#ffbf00",

    lightDirection: [0.7, 1.0, 0.5],

    lineSpacing: 8.0,
    lineWidth: 1.15,

    dotRadius: 0.55,
    dotSpacing: 0.5,

    deepShadowLevel: 0.22,
    midShadowLevel: 0.48,
    lightShadowLevel: 0.76,

    outlineStart: 0.08,
    outlineEnd: 0.30,

    screenPattern: 1.0,
    hatchRotation: 0.5,
    hatchStrength: 1.0,

    // Random point gradient
    randomDots: {
      enabled: true,
      density: 38.0,      // Higher = more dots
      dotSize: 1.4,       // Pixel size of random dots
      intensity: 0.45,    // 0.0 = no dots, 1.0 = full ink
      variation: 0.6      // Random variation amount
    }
  },

  // Geometry edges
  edges: {
    enabled: true,
    color: "#1100ff",
    thresholdAngle: 18
  },

  // Ground grid
  grid: {
    enabled: true,
    size: 20,
    divisions: 20,
    colorCenter: "#ffffff",
    colorGrid: "#ffffff",
    opacity: 0.28
  },

  // Motion
  animation: {
    autoRotate: true,
    speed: 0.0025,
    idleDelay: 2000 // ms to wait after last interaction
  }
};


/* =========================================================
   PRESETS
   ========================================================= */

const PRESETS = {
  clean: {
    backgroundColor: "#f7f5ef",

    shader: {
      inkColor: "#171717",
      paperColor: "#f7f5ef",
      lineSpacing: 10.0,
      lineWidth: 0.8,
      dotRadius: 0.8,
      dotSpacing: 1.4,
      outlineStart: 0.04,
      outlineEnd: 0.20,
      hatchStrength: 0.8,
      randomDots: {
        density: 42.0,
        dotSize: 1.0,
        intensity: 0.35,
        variation: 0.5
      }
    },

    edges: {
      thresholdAngle: 24
    }
  },

  comic: {
    backgroundColor: "#ffffff",

    shader: {
      inkColor: "#000000",
      paperColor: "#ffffff",
      lineSpacing: 9.0,
      lineWidth: 1.8,
      dotRadius: 1.5,
      dotSpacing: 1.25,
      outlineStart: 0.12,
      outlineEnd: 0.38,
      hatchStrength: 1.0,
      randomDots: {
        density: 45.0,
        dotSize: 1.8,
        intensity: 0.55,
        variation: 0.7
      }
    },

    edges: {
      thresholdAngle: 15
    }
  },

  dense: {
    backgroundColor: "#eeeade",

    shader: {
      inkColor: "#101010",
      paperColor: "#eeeade",
      lineSpacing: 5.5,
      lineWidth: 1.0,
      dotRadius: 1.0,
      dotSpacing: 1.1,
      deepShadowLevel: 0.30,
      midShadowLevel: 0.58,
      lightShadowLevel: 0.82,
      outlineStart: 0.10,
      outlineEnd: 0.34,
      hatchStrength: 1.0,
      randomDots: {
        density: 52.0,
        dotSize: 1.2,
        intensity: 0.50,
        variation: 0.65
      }
    },

    edges: {
      thresholdAngle: 12
    }
  }
};


/* =========================================================
   MERGE SELECTED PRESET
   ========================================================= */

function mergeSettings(base, override) {
  return {
    ...base,
    ...(override || {}),

    camera: {
      ...base.camera,
      ...(override && override.camera ? override.camera : {})
    },

    shader: {
      ...base.shader,
      ...(override && override.shader ? override.shader : {}),
      randomDots: {
        ...base.shader.randomDots,
        ...(override &&
            override.shader &&
            override.shader.randomDots
          ? override.shader.randomDots
          : {})
      }
    },

    edges: {
      ...base.edges,
      ...(override && override.edges ? override.edges : {})
    },

    grid: {
      ...base.grid,
      ...(override && override.grid ? override.grid : {})
    },

    animation: {
      ...base.animation,
      ...(override && override.animation ? override.animation : {})
    }
  };
}

const VIEW = SETTINGS.preset === "custom"
  ? SETTINGS
  : mergeSettings(SETTINGS, PRESETS[SETTINGS.preset]);


/* =========================================================
   GLSL SHADERS
   ========================================================= */

const vertexShader = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vObjectPosition = position;
    vViewNormal = normalize(normalMatrix * normal);

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -viewPosition.xyz;

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uInkColor;
  uniform vec3 uPaperColor;
  uniform vec3 uLightDirection;

  uniform float uLineSpacing;
  uniform float uLineWidth;
  uniform float uDotRadius;
  uniform float uDotSpacing;

  uniform float uDeepShadowLevel;
  uniform float uMidShadowLevel;
  uniform float uLightShadowLevel;

  uniform float uOutlineStart;
  uniform float uOutlineEnd;

  uniform float uScreenPattern;
  uniform float uHatchRotation;
  uniform float uHatchStrength;

  // Random dot gradient controls
  uniform float uRandomDotsEnabled;
  uniform float uRandomDotsDensity;
  uniform float uRandomDotsSize;
  uniform float uRandomDotsIntensity;
  uniform float uRandomDotsVariation;

  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectPosition;
  varying vec2 vUv;

  mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat2(
      c, -s,
      s,  c
    );
  }

  float linePattern(
    vec2 coordinate,
    float spacing,
    float width
  ) {
    float lineDistance =
      abs(mod(coordinate.x + spacing * 0.5, spacing) - spacing * 0.5);

    float antialiasWidth = max(fwidth(lineDistance), 0.75);

    return 1.0 - smoothstep(
      width,
      width + antialiasWidth,
      lineDistance
    );
  }

  float dotPattern(
    vec2 coordinate,
    float spacing,
    float radius
  ) {
    vec2 cell =
      mod(coordinate + spacing * 0.5, spacing) - spacing * 0.5;

    float distanceToCenter = length(cell);
    float antialiasWidth = max(fwidth(distanceToCenter), 0.75);

    return 1.0 - smoothstep(
      radius,
      radius + antialiasWidth,
      distanceToCenter
    );
  }

  float hash(vec2 p) {
    return fract(
      sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123
    );
  }

  float randomDotPattern(
    vec2 coordinate,
    float density,
    float dotSize,
    float variation
  ) {
    vec2 scaled = coordinate / density;
    vec2 cellIndex = floor(scaled);
    vec2 local = fract(scaled);

    float randomOffsetX = hash(cellIndex);
    float randomOffsetY = hash(cellIndex + vec2(31.7, 17.3));

    float dotX = mix(
      -variation,
      variation,
      randomOffsetX
    );

    float dotY = mix(
      -variation,
      variation,
      randomOffsetY
    );

    vec2 dotCenter = vec2(0.5 + dotX, 0.5 + dotY);

    float distanceToCenter = distance(local, dotCenter);

    return 1.0 - smoothstep(
      dotSize * 0.35,
      dotSize * 0.65,
      distanceToCenter * density * 0.4
    );
  }

  void main() {
    vec3 normal = normalize(vViewNormal);
    vec3 viewDirection = normalize(vViewPosition);
    vec3 lightDirection = normalize(uLightDirection);

    float lightAmount = max(
      dot(normal, lightDirection),
      0.0
    );

    vec2 screenCoordinate = gl_FragCoord.xy;
    vec2 objectCoordinate = vObjectPosition.xy * 45.0;

    vec2 patternCoordinate = mix(
      objectCoordinate,
      screenCoordinate,
      uScreenPattern
    );

    patternCoordinate =
      rotate2D(uHatchRotation) * patternCoordinate;

    float diagonalA = linePattern(
      vec2(
        patternCoordinate.x + patternCoordinate.y,
        patternCoordinate.y
      ),
      uLineSpacing,
      uLineWidth
    );

    float diagonalB = linePattern(
      vec2(
        patternCoordinate.x - patternCoordinate.y,
        patternCoordinate.y
      ),
      uLineSpacing,
      uLineWidth
    );

    float dots = dotPattern(
      patternCoordinate,
      uLineSpacing * uDotSpacing,
      uDotRadius
    );

    float hatch = 0.0;

    if (lightAmount < uDeepShadowLevel) {
      hatch = max(diagonalA, diagonalB);
    }
    else if (lightAmount < uMidShadowLevel) {
      hatch = diagonalA;
    }
    else if (lightAmount < uLightShadowLevel) {
      hatch = dots;
    }

    hatch *= uHatchStrength;

    // Random point gradient on surface
    float randomDots = 0.0;

    if (uRandomDotsEnabled > 0.5) {
      float randomDotValue = randomDotPattern(
        patternCoordinate,
        uRandomDotsDensity,
        uRandomDotsSize,
        uRandomDotsVariation
      );

      randomDots = randomDotValue * uRandomDotsIntensity;
    }

    float normalViewAmount = abs(
      dot(normal, viewDirection)
    );

    float outline = 1.0 - smoothstep(
      uOutlineStart,
      uOutlineEnd,
      normalViewAmount
    );

    float inkAmount = clamp(
      max(hatch, max(outline, randomDots)),
      0.0,
      1.0
    );

    vec3 finalColor = mix(
      uPaperColor,
      uInkColor,
      inkAmount
    );

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;


/* =========================================================
   MATERIAL CREATORS
   ========================================================= */

function createArchigramMaterial() {
  const style = VIEW.shader;

  const lightDirection = new THREE.Vector3(
    ...style.lightDirection
  ).normalize();

  const randomDots = style.randomDots;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,

    uniforms: {
      uInkColor: {
        value: new THREE.Color(style.inkColor)
      },

      uPaperColor: {
        value: new THREE.Color(style.paperColor)
      },

      uLightDirection: {
        value: lightDirection
      },

      uLineSpacing: {
        value: style.lineSpacing
      },

      uLineWidth: {
        value: style.lineWidth
      },

      uDotRadius: {
        value: style.dotRadius
      },

      uDotSpacing: {
        value: style.dotSpacing
      },

      uDeepShadowLevel: {
        value: style.deepShadowLevel
      },

      uMidShadowLevel: {
        value: style.midShadowLevel
      },

      uLightShadowLevel: {
        value: style.lightShadowLevel
      },

      uOutlineStart: {
        value: style.outlineStart
      },

      uOutlineEnd: {
        value: style.outlineEnd
      },

      uScreenPattern: {
        value: style.screenPattern
      },

      uHatchRotation: {
        value: style.hatchRotation
      },

      uHatchStrength: {
        value: style.hatchStrength
      },

      uRandomDotsEnabled: {
        value: randomDots.enabled ? 1.0 : 0.0
      },

      uRandomDotsDensity: {
        value: randomDots.density
      },

      uRandomDotsSize: {
        value: randomDots.dotSize
      },

      uRandomDotsIntensity: {
        value: randomDots.intensity
      },

      uRandomDotsVariation: {
        value: randomDots.variation
      }
    },

    extensions: {
      derivatives: true
    }
  });
}

function createEdgeMaterial() {
  return new THREE.LineBasicMaterial({
    color: new THREE.Color(VIEW.edges.color),
    transparent: false
  });
}


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.ARCHIGRAM = {
  SETTINGS,
  VIEW,
  createArchigramMaterial,
  createEdgeMaterial
};
