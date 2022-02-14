<script>
  import streamSaver from "streamsaver";
  import { CommandButton, FetchCommand } from "svelte-command";
  import { session, headers } from "../util.mjs";
  import { api } from "../constants.mjs";
  let dump;

  function backupCommand() {
    return new FetchCommand(
      api + "/admin/backup",
      {
        headers: headers(session)
      },
      {
        title: "Backup",
        responseHandler: async response => {
          try {
            const fileStream = streamSaver.createWriteStream("backup.txt");

            return response.body.pipeTo(fileStream);
          } catch (e) {
            console.log(e);
            dump = await response.text();
          }
        }
      }
    );
  }
</script>

<div>
  <CommandButton command={backupCommand}/>
  <CommandButton
    command={new FetchCommand(api + '/admin/restore', { method: 'POST', headers: headers(session) }, { title: 'Restore' })} />

  {#if dump !== undefined}<textarea bind:value={dump} />{/if}
</div>
