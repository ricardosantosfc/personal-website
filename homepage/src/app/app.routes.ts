import { Routes } from '@angular/router';
import { Who } from './who/who';
import { What } from './what/what';

export const routes: Routes = [
    {path: '', component: Who},
    {path: 'what', component: What}
];
