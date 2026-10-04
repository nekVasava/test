import { runAllRegressionTests } from '../src/services/regressionTests';
import { runAccessibilityTests } from './accessibility-tests';

async function main() {
  console.log('🚀 Running CalcNest Automated Regression & Unit Test Suite...\n');
  const results = [...await runAllRegressionTests(), ...runAccessibilityTests()];
  
  let passedCount = 0;
  let failedCount = 0;

  results.forEach((r, idx) => {
    const icon = r.status === 'passed' ? '✅' : '❌';
    console.log(`${icon} [${idx + 1}/${results.length}] (${r.category}) ${r.name}`);
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual:   ${r.actual}`);
    if (r.status === 'passed') {
      passedCount++;
    } else {
      failedCount++;
      if (r.errorDetails) {
        console.log(`   Error:    ${r.errorDetails}`);
      }
    }
    console.log('');
  });

  console.log('==================================================');
  console.log(`Summary: Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('==================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${results.length} AUTOMATED TESTS PASSED SUCCESSFULLY!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
