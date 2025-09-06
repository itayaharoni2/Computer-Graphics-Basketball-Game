export class BallTrail {
  constructor(scene, ballMesh, maxPoints = 48) {
    this.scene = scene;
    this.ball = ballMesh;
    this.max = maxPoints;
    this.positions = new Float32Array(this.max * 3);
    this.count = 0;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geom.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    this.line = new THREE.Line(geom, mat);
    this.line.frustumCulled = false;
    scene.add(this.line);
  }

  update(active, pos) {
    if (active) {
      if (this.count < this.max) this.count += 1;
      for (let i = this.count - 1; i > 0; --i) {
        this.positions[i*3+0] = this.positions[(i-1)*3+0];
        this.positions[i*3+1] = this.positions[(i-1)*3+1];
        this.positions[i*3+2] = this.positions[(i-1)*3+2];
      }
      this.positions[0] = pos.x; this.positions[1] = pos.y; this.positions[2] = pos.z;
    } else if (this.count > 0) {
      for (let i = 0; i < this.count - 1; ++i) {
        this.positions[i*3+0] = this.positions[(i+1)*3+0];
        this.positions[i*3+1] = this.positions[(i+1)*3+1];
        this.positions[i*3+2] = this.positions[(i+1)*3+2];
      }
      this.count -= 1;
    }
    this.line.geometry.setDrawRange(0, Math.max(0, this.count));
    this.line.geometry.attributes.position.needsUpdate = true;
  }

  clear() {
    this.count = 0;
    this.line.geometry.setDrawRange(0, 0);
    this.line.geometry.attributes.position.needsUpdate = true;
  }
}
