# usaa2qif

This package is a simple script I wrote in an afternoon to convert USAA Bank
Statements to QIF files for import into banking software.

This should not be considered stable, and is probably quite broken. I still
have some work to do to make this convenient, and still requires hard coding
the PDF names into index.js. I'll probably fix it at some point...feel free to
file a PR for that though if you find this useful.

## NPM Users!

While you *can* install this with either `yarn add usaa2qif` or
`npm install usaa2qif`, I recommend going to github.com/ocelotsloth/usaa2qif
instead. The repository is not currently working to where it has a decent
command line interface that can be global, and the demo files are not included
in the `npm publish` to save in file sizes on NPM.

## Installation

`git clone git@github.com:ocelotsloth/usaa2qif.git`

`cd usaa2qif`

`yarn install`

## Usage

Simply put the PDF files you want into the same directory and include their
names in the array at the start of the file.

`node index.js`

I have included a sample statement for testing in the project directory. Feel
free to play with it (I took my important information out, rest assured :P).

### A note on long statements.

At the moment, if your statement goes onto a second page of transactions, I
still need to write the code to make this tolerant.

A good work around in the mean time would either be to fix it or to remove the
"OTHER DEBITS" text using LibreOffice Draw.

## License

```
usaa2qif: NodeJS Module to Convert USAA Statements to QIF Files
Copyright (C) 2017 Mark Stenglein <mark@stengle.in>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
