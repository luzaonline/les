import {Component, OnInit, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';
import {ElectronService} from '../../providers/electron.service';
import {SockService} from '../../providers/sock.service';
import {Subscription} from 'rxjs';
import {LocalStorageService} from 'ngx-webstorage';
import {MatTableDataSource} from '@angular/material';
import * as path from 'path';
import {PdfGenerationService} from '../../providers/pdf-generation.service';
import { rootPath } from 'electron-root-path';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy, OnChanges {

  public displayedColumns = ['name', 'path'];
  public dataSource = new MatTableDataSource<string>();
  newFileBuffer: Subscription;
  ModelChange: Subscription;
  modelFolder: string;
  outPdf: any;

  constructor(private electron: ElectronService,
              private sock: SockService,
              private localStorage: LocalStorageService,
              private pdf: PdfGenerationService) {

    this.newFileBuffer = this.sock.dati.subscribe((event) => {
      let tempPath;
      let cmdPosition;
      let finalPath;
      tempPath = String.fromCharCode.apply(null, new Uint16Array(event));
      cmdPosition = tempPath.indexOf('/cmd') + 4;
      finalPath = tempPath.substring(cmdPosition, tempPath.length - 1);

      let cmd;
      if (finalPath.length > 0) {
        if (process.platform === 'win32') {
          cmd = rootPath + '\\bin\\curl.exe -k "sftp://10.76.139.29:22' +
            finalPath.trim() + '" --user "root:hp" -o "' + rootPath + '\\data.csv"';
        } else {
          cmd = 'curl -k "sftp://10.76.139.29:22' + finalPath.trim() + '" --user "root:hp" -o "' + rootPath + '/data.csv"';
          // cmd = 'curl -k "sftp://10.76.139.130:22' + finalPath.trim() + '" --user "andrea:123" -o "' + appPath + '/data.csv"';
        }
        console.log(cmd);
        this.electron.childProcess.exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error('exec error: ', stderr);
            return;
          } else {
            this.printPdf();
          }
        });
      }
    });

  }


  ngOnInit() {
    this.dataSource.data =
      [
        'PROFORMA INVOICE',
        'INVOICE',
        'DELIVERY NOTE',
        'ORDER CONFIRMATION'
      ];
  }

  ngOnDestroy() {

  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  public printPdf() {
    let pathFile;
    if (process.platform === 'win32') {
      pathFile = rootPath + '\\data.csv';
    } else {
      pathFile = rootPath + '/data.csv';
    }
    const buffer = this.electron.fs.readFileSync(pathFile);
    console.log(String.fromCharCode.apply(null, new Uint16Array(buffer)));
    const tempParse = this.csv2Array(String.fromCharCode.apply(null, new Uint16Array(buffer)));
    console.log('OUTPUT: \n' + tempParse);
    this.pdf.printOrder(tempParse);
  }

  csv2Array(fileInput: any) {
    const allTextLines = fileInput.split(/\r|\n|\r/);
    const headers = allTextLines[0].split('|');
    const lines = [];

    for (let i = 0; i < allTextLines.length; i++) {
      const data = allTextLines[i].split('|');
      if (data.length === headers.length) {
        const tarr = [];
        for (let j = 0; j < headers.length; j++) {
          tarr.push(data[j]);
        }
        // console.log(tarr);
        lines.push(tarr);
      }
    }
    return lines;
  }
}

