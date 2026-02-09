/**
 * Formats a flat array of numbers as a text matrix.
 *
 * @param arr  - flat array of matrix values (row-major order)
 * @param rows - number of rows
 * @param cols - number of columns
 * @returns A multi-line string representing the matrix with aligned columns
 */
export function formatMatrix(arr: number[], rows: number, cols: number): string {
  const lines: string[] = []
  for (let r = 0; r < rows; r++) {
    const cells: string[] = []
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const value = idx < arr.length ? arr[idx] : 0
      cells.push(value.toFixed(4).padStart(10))
    }
    lines.push(cells.join(''))
  }
  return lines.join('\n')
}
