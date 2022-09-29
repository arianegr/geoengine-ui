import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginComponent} from '../features/login/login.component';
import {GfbioModuleComponent} from './gfbio-module/gfbio-module.component';

const routes: Routes = [
    {path: '', redirectTo: 'map', pathMatch: 'full'},
    {path: 'map', component: GfbioModuleComponent},
    {path: 'signin', component: LoginComponent},
    // seems to be a good fallback if we cannot acces `map`
    {path: '**', redirectTo: 'signin', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class GfbioRoutingModule {}
