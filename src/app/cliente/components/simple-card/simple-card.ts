import { ChangeDetectionStrategy, Component, input, InputSignal, output } from '@angular/core';

@Component({
  selector: 'app-simple-card',
  imports: [],
  templateUrl: './simple-card.html',
  styleUrl: './simple-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleCard {
  public id: InputSignal<number> = input.required();
  public src: InputSignal<string> = input.required();
  public title: InputSignal<string> = input.required();
  public subtitle: InputSignal<string> = input('');

  public cardClicked = output<number>();
  
}
