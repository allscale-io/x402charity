```bash
#!/bin/bash

# Record the terminal session using asciinema
asciinema rec -c "npx x402charity donate testing-charity '$0.001' --network base-sepolia" demo.cast

# Convert the recorded session to a GIF using agg
agg demo.cast demo.gif

# Add the GIF to the README
echo "## CLI Demo" >> README.md
echo "" >> README.md
echo "![CLI Demo](demo.gif)" >> README.md
echo "" >> README.md
```

### Explanation:
1. **Recording the Terminal Session**: The script uses `asciinema` to record the terminal session while executing the command `npx x402charity donate testing-charity '$0.001' --network base-sepolia`. The recording is saved as `demo.cast`.

2. **Converting to GIF**: The recorded session is then converted to a GIF using `agg`, which is saved as `demo.gif`.

3. **Updating README**: The script appends the GIF to the `README.md` file under a new section titled "CLI Demo".

### Test Cases:
1. Ensure `asciinema` and `agg` are installed on the system.
2. Verify that the command `npx x402charity donate testing-charity '$0.001' --network base-sepolia` runs successfully and outputs a transaction hash.
3. Check that the `demo.gif` is generated and correctly displayed in the `README.md` file.

This script should be run in the root directory of the `allscale-io/x402charity` repository.