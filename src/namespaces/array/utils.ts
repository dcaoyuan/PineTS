export function precision(value: any, epsilon: number = 1e10): number {
    return typeof value === 'number' ? Math.round(value * epsilon) / epsilon : value;
}
