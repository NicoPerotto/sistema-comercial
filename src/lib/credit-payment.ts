function round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateAppliedAmount(receivedAmount: number, percentage: number): number | null {
    const multiplier = 1 + percentage / 100;
    if (!Number.isFinite(receivedAmount) || !Number.isFinite(multiplier) || multiplier <= 0) return null;
    return round2(receivedAmount / multiplier);
}

export function calculateReceivedAmount(appliedAmount: number, percentage: number): number | null {
    const multiplier = 1 + percentage / 100;
    if (!Number.isFinite(appliedAmount) || !Number.isFinite(multiplier) || multiplier <= 0) return null;
    return round2(appliedAmount * multiplier);
}
