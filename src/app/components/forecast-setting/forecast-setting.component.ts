import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-forecast-setting',
  templateUrl: './forecast-setting.component.html',
  styleUrls: ['./forecast-setting.component.scss']
})
export class ForecastSettingComponent implements OnInit {

  @Input() icon?: string = undefined;
  @Input() name: string = '';
  @Input() helpText: string = '';

  constructor() { }

  ngOnInit(): void {
  }

}
