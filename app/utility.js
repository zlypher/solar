// gluLookAt
export function makeLookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    let eye = $V([ex, ey, ez]);
    let center = $V([cx, cy, cz]);
    let up = $V([ux, uy, uz]);

    let z = eye.subtract(center).toUnitVector();
    let x = up.cross(z).toUnitVector();
    let y = z.cross(x).toUnitVector();

    let m = $M([[x.e(1), x.e(2), x.e(3), 0],
        [y.e(1), y.e(2), y.e(3), 0],
        [z.e(1), z.e(2), z.e(3), 0],
        [0, 0, 0, 1]]);

    let t = $M([[1, 0, 0, -ex],
        [0, 1, 0, -ey],
        [0, 0, 1, -ez],
        [0, 0, 0, 1]]);

    return m.x(t);
}

// gluPerspective
export function makePerspective(fovy, aspect, znear, zfar) {
    let ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    let ymin = -ymax;
    let xmin = ymin * aspect;
    let xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

// glFrustum
export function makeFrustum(left, right, bottom, top, znear, zfar) {
    let X = 2*znear/(right-left);
    let Y = 2*znear/(top-bottom);
    let A = (right+left)/(right-left);
    let B = (top+bottom)/(top-bottom);
    let C = -(zfar+znear)/(zfar-znear);
    let D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
        [0, Y, B, 0],
        [0, 0, C, D],
        [0, 0, -1, 0]]);
}

// glOrtho
export function makeOrtho(left, right, bottom, top, znear, zfar) {
    let tx = - (right + left) / (right - left);
    let ty = - (top + bottom) / (top - bottom);
    let tz = - (zfar + znear) / (zfar - znear);

    return $M([[2 / (right - left), 0, 0, tx],
        [0, 2 / (top - bottom), 0, ty],
        [0, 0, -2 / (zfar - znear), tz],
        [0, 0, 0, 1]]);
}
