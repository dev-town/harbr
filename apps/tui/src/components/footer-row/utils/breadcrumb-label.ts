export function breadcrumbLabel(value: string) {
  return value.split(' › ').join(' > ')
}
