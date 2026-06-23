import { Component, signal, TemplateRef, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ComponentPortal } from '@angular/cdk/portal';
import { IdeaComponent } from '../../components';
import { HeaderComponent } from 'app/shared/components';
import { PortalService } from 'app/core/services/portal/portal.service';
import { ButtonComponent, InputComponent, TextAreaComponent, SegmentedControlsComponent, ModalComponent } from 'app/shared/ui';
import { Ideas, Roadmap } from '../../models/ideas.interface';
import { TaskComponent } from 'app/features/tasks/components/task/task.component';
import { Segment } from 'app/shared/ui/segmented-controls/segmented-controls.component';

@Component({
  selector: 'app-ideas-root-page',
  imports: [
    NgClass, 
    ReactiveFormsModule, 
    IdeaComponent, 
    HeaderComponent, 
    ButtonComponent, 
    InputComponent, 
    TextAreaComponent, 
    SegmentedControlsComponent, 
    TaskComponent,
  ],
  templateUrl: './ideas-root.page.html',
  styleUrl: './ideas-root.page.css',
})

export class IdeasRootPageComponent {
  constructor(
    private portal: PortalService,
  ){}

  public selectedSegment: WritableSignal<number> = signal(0);
  public segments: Segment[] = [ { title: 'Запропоновані ідеї' }, { title: 'Плани' } ]

  public ideas: Ideas[] = [
    {
      date: '2026-02-06',
      ideas: [
        {
          id: 1,
          title: 'Зберігання карток',
          description: 'Додати можливість додавати картки у збережене.',
          votes: 3,
          voted: false,
          date: '2026-02-06'
        },
        {
          id: 2,
          title: 'Зберігання карток 2',
          description: 'Додати можливість додавати картки у збережене.',
          votes: 0,
          voted: false,
          date: '2026-02-06'
        }
      ]
    },
    {
      date: '2026-02-06',
      ideas: [
        {
          id: 1,
          title: 'Зберігання карток',
          description: 'Додати можливість додавати картки у збережене.',
          votes: 3,
          voted: false,
          date: '2026-02-06'
        }
      ]
    }
  ]

  public roadmap: Roadmap = {
    inProgress: [{
      id: 1,
      title: "Додавання ідей",
      description: "Дати можливість додавати ідеї користувачам.",
      date: "2026-06-02",
    }],
    inFuture: [
      {
        id: 2,
        title: "Додавати картки у обране",
        description: "Дати можливість зберігати картки користувачам.",
        date: "2026-06-02",
      }
    ],
    completed: [
      {
        date: "2026-06-02",
        tasks: [
          {
            id: 1,
            title: "Не знаю",
            description: "Вкинонав те, що не знаю.",
            date: "2026-06-02",
          },
          {
            id: 1,
            title: "Не знаю",
            description: "Вкинонав те, що не знаю.",
            date: "2026-06-02",
          }
        ]
      },
      {
        date: "2026-06-02",
        tasks: [
          {
            id: 1,
            title: "Не знаю",
            description: "Вкинонав те, що не знаю.",
            date: "2026-06-02",
          }
        ]
      }
    ]
  }
  
  public ideaForm = new FormGroup<{
    title: FormControl<string>,
    description: FormControl<string>;
  }>({
    title: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(5), Validators.maxLength(50)]}),
    description: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)]}),
  })

  public openModal(template: TemplateRef<any>) {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Запропонувати ідею',
        template: template
      }
    })
  }

  public closeModal() {
    this.portal.close()
  }

  public onSubmit() {

  }
}
