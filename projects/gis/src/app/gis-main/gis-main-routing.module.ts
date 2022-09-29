import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {IsLoggedInGuard} from '@geoengine/core';
import {CanRegisterGuard} from '../features/guards/can-register.guard';
import {LoginComponent} from '../features/login/login.component';
import {RegisterComponent} from '../features/register/register.component';
import {GisMainComponent} from './main/gis-main.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'map',
        pathMatch: 'full',
    },
    {path: 'map', component: GisMainComponent, canActivate: [IsLoggedInGuard]},
    {path: 'signin', component: LoginComponent},
    {path: 'register', component: RegisterComponent, canActivate: [CanRegisterGuard]},
    // seems to be a good fallback if we cannot acces `map`
    {path: '**', redirectTo: 'signin', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    providers: [IsLoggedInGuard, CanRegisterGuard],
    exports: [RouterModule],
})
export class GisRoutingModule {}
