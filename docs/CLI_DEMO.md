# CLI Demo

## x402charity CLI in Action

```bash
$ npx x402charity list
Available charities:
  - testing-charity: Testing Charity (testnet)
  - protocol-guild: Protocol Guild (public goods)

$ npx x402charity donate testing-charity '$0.001' --network base-sepolia

Donating $0.001 USDC to "Testing Charity" on base-sepolia...

Donation successful!

  Charity:  Testing Charity
  Amount:   $0.001 USDC
  Tx Hash:  0x7a3f...9e2d
  Chain:    base-sepolia
  From:     0x1234...5678
  To:       0x8DC1...70c6d
```

## Recording Your Own Demo

To create a terminal recording GIF like the one requested in issue #3:

### Option 1: Using VHS
```bash
# Install vhs
# See: https://github.com/charmbracelet/vhs

# Create a tape file
cat > demo.tape << 'TAPE'
Output demo.gif
Set FontSize 20
Set Width 1200
Set Height 600

Type "npx x402charity donate testing-charity '$0.001' --network base-sepolia"
Enter
Sleep 2s
TAPE

# Record
vhs demo.tape
```

### Option 2: Using asciinema + agg
```bash
# Install
pip install asciinema agg

# Record
asciinema rec demo.cast
# ... run your commands ...
# Press Ctrl+D to stop

# Convert to GIF
agg demo.cast demo.gif
```

### Option 3: Using terminalizer
```bash
npm install -g terminalizer
terminalizer record demo
terminalizer render demo
```
