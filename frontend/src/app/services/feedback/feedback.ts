import { Injectable } from '@angular/core';
import { FEEDBACK_MESSAGES_FAILURE, FEEDBACK_MESSAGES_SUCCESS } from '../../const/feedback';

@Injectable({
  providedIn: 'root'
})
export class Feedback {
  getFeedbackMessage(success: boolean): string {
      const messages = success 
          ? FEEDBACK_MESSAGES_SUCCESS 
          : FEEDBACK_MESSAGES_FAILURE;
  
      const index = Math.floor(Math.random() * messages.length);
      return messages[index];
  }
}
