import { Component, Injector } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from '@shared/app-component-base';
import { AccountServiceProxy, TenantAvailabilityState } from '@shared/service-proxies/service-proxies';
import {
  IsTenantAvailableInput,
  IsTenantAvailableOutput
} from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: './tenant-change-dialog.component.html'
})
export class TenantChangeDialogComponent extends AppComponentBase {
  saving = false;
  tenancyName = '';

  constructor(
    injector: Injector,
    private _accountService: AccountServiceProxy,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  save(): void {
    if (!this.tenancyName) {
      abp.multiTenancy.setTenantIdCookie(undefined);
      this.bsModalRef.hide();
      location.reload();
      return;
    }

    const input = new IsTenantAvailableInput();
    input.tenancyName = this.tenancyName;

    this.saving = true;
    this._accountService
      .isTenantAvailable(input)
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe((result: IsTenantAvailableOutput) => {
        switch (result.state) {
          case TenantAvailabilityState.Available:
            abp.multiTenancy.setTenantIdCookie(result.tenantId);
            location.reload();
            return;
          case TenantAvailabilityState.InActive:
            this.message.warn(this.l('TenantIsNotActive', this.tenancyName));
            break;
          case TenantAvailabilityState.NotFound:
            this.message.warn(
              this.l('ThereIsNoTenantDefinedWithName{0}', this.tenancyName)
            );
            break;
        }
      });
  }
}
