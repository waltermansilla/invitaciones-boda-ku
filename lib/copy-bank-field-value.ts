/**
 * Texto a copiar al portapapeles según el label del dato (transferencia / honeymoon).
 * Si el label es "Alias", solo copia el alias: termina al primer separador
 * (espacio + paréntesis/guión, paréntesis, guión con espacios o pipe).
 */
export function copyValueForBankField(label: string, value: string): string {
    const trimmed = value.trim();
    if (!/^alias$/i.test(label.trim())) return trimmed;

    const sep = trimmed.search(/\s+[\(-–|]|\s*\(|\s+-\s+|\s+\|\s+/);
    if (sep < 0) return trimmed;
    return trimmed.slice(0, sep).trim();
}
