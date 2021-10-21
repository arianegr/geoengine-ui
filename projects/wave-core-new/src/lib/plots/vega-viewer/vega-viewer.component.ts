import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    Output,
    EventEmitter,
} from '@angular/core';
import vegaEmbed from 'vega-embed';
import {View} from 'vega';
import {TopLevelSpec as VlSpec} from 'vega-lite';
import {Spec as VgSpec} from 'vega';

export interface VegaChartData {
    readonly vegaString: string;
    readonly metadata?: {
        readonly selectionName?: string;
    };
}

@Component({
    selector: 'wave-vega-viewer',
    templateUrl: './vega-viewer.component.html',
    styleUrls: ['./vega-viewer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VegaViewerComponent implements OnInit, OnChanges {
    @Input()
    chartData?: VegaChartData;

    @Input()
    width?: number;

    @Input()
    height?: number;

    @Output()
    interactionChange = new EventEmitter<{[signal: string]: any}>();

    @ViewChild('chart', {static: true}) protected chartContainer!: ElementRef;

    private vegaHandle?: {
        view: View;
        spec: VlSpec | VgSpec;
        vgSpec: VgSpec;
        finalize: () => void;
    } = undefined;

    constructor(protected element: ElementRef) {}

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.chartData || changes.width || changes.height) {
            this.clearContents();
            this.displayPlot();
        }
    }

    private displayPlot(): void {
        if (!this.chartData) {
            return;
        }

        const div = this.chartContainer.nativeElement;

        const width = this.width ?? (div.clientWidth || this.element.nativeElement.offsetWidth);
        const height = this.height ?? width / 2;

        const spec = JSON.parse(this.chartData.vegaString);

        vegaEmbed(div, spec, {
            actions: false,
            theme: 'ggplot2',
            renderer: 'svg',
            config: {
                autosize: {
                    type: 'fit',
                    contains: 'padding',
                },
            },
            // This is required, since width and height are ignored for vega-lite specs see https://github.com/vega/vega-embed Options -> Width
            patch: (spec:VgSpec) =>  { spec.width = width; spec.height = height; return spec; },
            width,
            height,
        })
            .then((result) => {
                this.vegaHandle = result;

                if (this.chartData?.metadata && this.chartData.metadata.selectionName) {
                    this.vegaHandle.view.addSignalListener(this.chartData.metadata.selectionName, (_name, value) => {
                        this.interactionChange.next(value);
                    });
                }
            })
            .catch((_error) => {
                // TODO: react on error
            });
    }

    private clearContents(): void {
        const div = this.chartContainer.nativeElement;

        if (this.vegaHandle) {
            this.vegaHandle.finalize();
            this.vegaHandle = undefined;
        }

        while (div.firstChild) {
            div.firstChild.remove();
        }
    }
}
