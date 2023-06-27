import { Component, ReactNode, createRef } from "react";
import * as PIXI from "pixi.js";
import classes from "./fancy_background.module.css";

// Fragment shader, in real use this would be much cleaner when loaded from a file
// or embedded into the application as data resource.
const fragment = `
varying vec2 vTextureCoord;
uniform vec3 iResolution;
uniform sampler2D uSampler;
uniform sampler2D noise;
uniform float time;

vec3 sin_shape(in vec2 uv, in float offset_y) {
  // Time varying pixel color
  float y = sin((uv.x + time * -0.06 + offset_y) * 5.5);

  float x = uv.x * 8.;
  float a=1.;
	for (int i=0; i<5; i++) {
		x*=0.53562;
		x+=6.56248;
		y+=sin(x)*a;		
		a*=.5;
	}

  float y0 = step(0.0, y * 0.08 - uv.y + offset_y);
  return vec3(y0, y0, y0);
}

vec2 rotate(vec2 coord, float alpha) {
  float cosA = cos(alpha);
  float sinA = sin(alpha);
  return vec2(coord.x * cosA - coord.y * sinA, coord.x * sinA + coord.y * cosA);
}

vec3 scene(in vec2 uv) {
    vec3 col = vec3(0.0, 0.0, 0.0);
    col += sin_shape(uv, 0.1) * 0.2;
    col += sin_shape(uv, 0.3) * 0.2;
    col += sin_shape(uv, 0.5) * 0.2;

    vec3 fragColor;

    if (col.x >= 0.6 ) {
      fragColor = vec3(0.10, 0.05, 0.36);
    } else if (col.x >= 0.4) {
      fragColor = vec3(0.18, 0.22, 0.67);
    } else if (col.x >= 0.2) {
      fragColor = vec3(0.29, 0.37, 0.92);
    } else {
      fragColor = vec3(0.07, 0.08, 0.35);
    }
    return fragColor;
}

void main()
{
  vec2 fragCoord = vec2(gl_FragCoord);

  fragCoord = rotate(fragCoord + vec2(0.0, -120.0), 0.22);
  // Normalized pixel coordinates (from 0 to 1)
  vec3 col0 = scene((fragCoord * 2.0)/iResolution.xy);
  vec3 col1 = scene(((fragCoord * 2.0) + vec2(1.0, 0.0))/iResolution.xy);
  vec3 col2 = scene(((fragCoord * 2.0) + vec2(1.0, 1.0))/iResolution.xy);
  vec3 col3 = scene(((fragCoord * 2.0) + vec2(0.0, 1.0))/iResolution.xy);

  vec2 uv = vec2(gl_FragCoord)/iResolution.xy;

  // Output to screen
  gl_FragColor = vec4((col0 + col1 + col2 + col2) / 4.0,1.0);
  gl_FragColor.xyz *= (uv.y * 0.73 + 0.25);
}
`;

export class FancyBackground extends Component {

  private containerRef = createRef<HTMLDivElement>();
  private app: PIXI.Application | undefined = undefined;

  componentDidMount(): void {
    const app = new PIXI.Application({
      resizeTo: this.containerRef.current!,
    });
    this.app = app;
    this.containerRef.current!.appendChild(app.view as HTMLCanvasElement);
    this.loadAssets();
  }

  private loadAssets() {
    const app = this.app;
    if (!app) {
      return;
    }

    // Build the filter
    const filter = new PIXI.Filter(undefined, fragment, {
        time: 0.0,
    });

    app.stage.filterArea = app.renderer.screen;
    app.stage.filters = [filter];

    let totalTime = 0;
    // Listen for animate update.
    app.ticker.add((delta) =>
    {
      filter.uniforms.time = totalTime;
      filter.uniforms.iResolution = [
        window.innerWidth,
        window.innerHeight,
        0,
      ]; 
      totalTime += delta / 60;
    });
  }

  componentWillUnmount(): void {
    this.app?.destroy();
  }

  render(): ReactNode {
    return (
      <div className={classes.fancyBackground} ref={this.containerRef}></div>
    );
  }

}
