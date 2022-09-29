import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';

import {GfbioModuleComponent} from './gfbio-module/gfbio-module.component';
import {HelpComponent} from '../features/help/help.component';
import {SplashDialogComponent} from '../features/splash-dialog/splash-dialog.component';
import {BasketDialogComponent} from '../features/basket/basket-dialog/basket-dialog.component';
import {BasketService} from '../features/basket/basket.service';
import {GfbioRoutingModule} from './gfbio-routing.module';
import {CoreModule} from '@geoengine/core';

@NgModule({
    declarations: [GfbioModuleComponent, HelpComponent, SplashDialogComponent, BasketDialogComponent],
    imports: [CommonModule, MatTableModule, MatButtonModule, GfbioRoutingModule, CoreModule],
    providers: [BasketService],
    bootstrap: [GfbioModuleComponent],
})
export class GfbioModule {}
