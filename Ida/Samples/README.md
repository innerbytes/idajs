## How to run any Sample in thos folder

- Make sure IdaJS is already installed
- Open a sample folder from PowerShell. For example `cd C:\Projects\idajs\Ida\Samples\storm`
- Install the dependencies: `node ../install.js`
- Start the sample: `npm start`

## `saves` folder (playthrough save games)

`saves` folder is not a sample, but a collection of a full playthrough save games files for all the game situations, with numbers and names. 
Those are useful for testing and modding when need to quickly load to a specific place in the LBA2 game.

- just copy all the files from the `saves` folder to your `idajs/GameRun/save` folder, or `idajs/GameRun/save/<your mod>` if using a mod. 
