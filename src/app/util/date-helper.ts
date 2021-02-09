// import * as moment from 'moment';
import { format } from 'date-fns'

export class DateHelper {
  static format(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }
}
