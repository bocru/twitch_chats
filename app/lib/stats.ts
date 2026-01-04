export function cosine(x: Readonly<Uint16Array>, y: Readonly<Uint16Array>) {
  const n = x.length
  let crossprod = 0
  let x_sq = 0
  let y_sq = 0
  for (let i = n; i--; ) {
    crossprod += x[i] * y[i]
    x_sq += Math.pow(x[i], 2)
    y_sq += Math.pow(y[i], 2)
  }
  return crossprod && x_sq && y_sq ? crossprod / Math.sqrt(x_sq) / Math.sqrt(y_sq) : 0
}

export function cor(x: Readonly<Uint16Array>, y: Readonly<Uint16Array>) {
  const n = x.length
  let crossprod = 0
  let x_sum = 0
  let x_sq = 0
  let y_sum = 0
  let y_sq = 0
  for (let i = n; i--; ) {
    const xi = x[i]
    const yi = y[i]
    crossprod += xi * yi
    x_sum += xi
    x_sq += Math.pow(xi, 2)
    y_sum += yi
    y_sq += Math.pow(yi, 2)
  }
  x_sum /= n
  y_sum /= n
  const res =
    crossprod && x_sq && y_sq
      ? (crossprod / n - x_sum * y_sum) /
        Math.sqrt(x_sq / n - Math.pow(x_sum, 2)) /
        Math.sqrt(y_sq / n - Math.pow(y_sum, 2))
      : 0
  return isNaN(res) ? 0 : res
}
