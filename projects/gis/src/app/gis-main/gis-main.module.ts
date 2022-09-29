import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';

import {GisMainComponent} from './main/gis-main.component';
import {CoreModule} from '@geoengine/core';
import {RegisterComponent} from '../features/register/register.component';
import {LoginComponent} from '../features/login/login.component';
import {GisRoutingModule} from './gis-main-routing.module';

@NgModule({
    declarations: [GisMainComponent, LoginComponent, RegisterComponent],
    imports: [CommonModule, MatTableModule, MatButtonModule, GisRoutingModule, CoreModule],
    bootstrap: [GisMainComponent],
})
export class GisModule {}
