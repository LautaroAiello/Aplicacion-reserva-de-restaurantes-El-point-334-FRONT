import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SimpleCard } from '../../components/simple-card/simple-card';

@Component({
  selector: 'app-cliente-home-page',
  imports: [SimpleCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteHomePage {
  protected mockCards = [
    {
      id: 1,
      imgUrl: 'https://picsum.photos/200/300',
      title: 'Card 1',
      subtitle: 'Subtitle 1',
    },
    {
      id: 2,
      imgUrl: 'https://picsum.photos/200/300',
      title: 'Card 2',
      subtitle: 'Subtitle 2',
    },
    {
      id: 3,
      imgUrl: 'https://picsum.photos/200/300',
      title: 'Card 3',
      subtitle: 'Subtitle 3',
    },
  ];

  public cardClicked(id: number):void  {
    console.log('Card clicked', id);
  }
}
