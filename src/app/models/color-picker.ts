export class ColorPicker {
  private readonly colors: string[] = [
    'rgb(101,179,46)',
    'rgb(124,189,196)',
    'rgb(192,210,54)',
    'rgb(62,91,132)',
    'rgb(0,140,117)',
    'rgb(130,66,141)',
    'rgb(232,104,63)',
    'rgb(184,26,93)'
  ];
  private indexCounter = 0;
  private modelColors = new Map<string, string>();

  pick(model: string): string {
    if(!this.modelColors.has(model)){
      this.modelColors.set(model, this.colors[this.indexCounter++ % this.colors.length])
    }
    return this.modelColors.get(model)!;
  }
}
