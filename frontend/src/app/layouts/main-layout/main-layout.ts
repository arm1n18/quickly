import { Component } from '@angular/core';
import { CustomButton, Icon } from "../../components/ui";
import { CustomInput } from '../../components/ui/custom-input/custom-input';
import { Avatar } from "../../components/ui/avatar/avatar";

@Component({
  selector: 'app-main-layout',
  imports: [CustomButton, Icon, CustomInput, Avatar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})

export class MainLayout {

}
