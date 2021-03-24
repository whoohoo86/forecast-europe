import { Pipe, PipeTransform } from '@angular/core';
import { isSaturday, setDay, subDays } from 'date-fns';

@Pipe({
  name: 'dateToPrevSaturday'
})
export class DateToPrevSaturdayPipe implements PipeTransform {

  transform(value: Date): Date {
    const sat = isSaturday(value) ? value : setDay(value, 6);
    return subDays(sat, 7);
  }

}
