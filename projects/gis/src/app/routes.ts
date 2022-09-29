import {Routes} from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        data: {name: 'gis', modules: ['all']},
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: 'home',
        data: {name: 'home', title: 'Home', modules: ['gis']},
        loadChildren: () => import('./gis-main/gis-main.module').then((m) => m.GisModule),
    },
    {
        path: 'home',
        data: {name: 'home', title: 'Home', modules: ['gfbio']},
        loadChildren: () => import('./gfbio/gfbio.module').then((m) => m.GfbioModule),
    },
];
