function mandelbrot(x, y, max_iter) {
    let i = 0;
    let cx = x;
    let cy = y;

    while (i < max_iter) {
        const nx = x * x - y * y + cx;
        const ny = 2 * x * y + cy;
        x = nx;
        y = ny;
        if (x * x + y * y > 2) {
            return i;
        }
        i++;
    }
    return max_iter;
}