// Plain JS wrapper for node execution
import { runAllRegressionTests } from '../src/services/regressionTests.ts';

async function main() {
  console.log('🚀 Executing CalcNest RC2 Automated Test Suite...\n');
  const results = await runAllRegressionTests();
  
  let passedCount = 0;
  let failedCount = 0;

  results.forEach((r, idx) => {
    const icon = r.status === 'passed' ? '✅' : '❌';
    console.log(`${icon} [${idx + 1}/${results.length}] (${r.category}) ${r.name}`);
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Observed: ${r.actual}`);
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

  console.log('===========================================================');
  console.log(`SUMMARY: Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('===========================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 34 AUTOMATED TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
