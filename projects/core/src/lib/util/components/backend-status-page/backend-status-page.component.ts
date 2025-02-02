import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {first, skipWhile, Subscription} from 'rxjs';
import {BackendInfoDict} from '../../../backend/backend.model';
import {BackendService} from '../../../backend/backend.service';
import {BackendStatus} from '../../../users/user.model';
import {UserService} from '../../../users/user.service';

@Component({
    selector: 'geoengine-backend-status-page',
    templateUrl: './backend-status-page.component.html',
    styleUrls: ['./backend-status-page.component.scss'],
})
export class BackendStatusPageComponent implements OnInit {
    public backendStatus: BackendStatus | undefined = undefined;
    public backendInfo: BackendInfoDict | undefined = undefined;
    public goToMapSubscription: Subscription | undefined = undefined;

    constructor(
        private userService: UserService,
        private backendService: BackendService,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
    ) {
        this.fetchBackendState();
    }

    ngOnInit(): void {}

    fetchBackendState(): void {
        this.userService.getBackendStatus().subscribe({
            next: (status) => {
                this.backendStatus = status;

                if (status.available) {
                    this.refreshBackendInfo();
                } else {
                    this.backendInfo = undefined;
                }

                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
        });
    }

    refreshBackendInfo(): void {
        this.backendService.getBackendInfo().subscribe({
            next: (backendInfo) => {
                this.backendInfo = backendInfo;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
            error: (_err) => {
                this.backendInfo = undefined;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            },
        });
    }

    refresh(): void {
        this.goToMapSubscription?.unsubscribe();
        this.userService.triggerBackendStatusUpdate();
    }

    goBack(): void {
        this.goToMapSubscription?.unsubscribe();
        this.goToMapSubscription = this.userService
            .getBackendStatus()
            .pipe(
                skipWhile((status) => status.available === false),
                first(),
            )
            .subscribe((_status) => {
                setTimeout(() => this.router.navigate(['/map']));
            });

        this.userService.triggerBackendStatusUpdate();
    }
}
